create table if not exists public.user_item_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.user_item_favorites enable row level security;

revoke all on public.user_item_favorites from anon, authenticated;
grant select on public.user_item_favorites to authenticated;

drop policy if exists "user_item_favorites_select_own_or_admin" on public.user_item_favorites;
create policy "user_item_favorites_select_own_or_admin"
on public.user_item_favorites for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create or replace function public.get_inventory_dashboard()
returns table (
  total_items integer,
  owned_unique_items integer,
  total_quantity integer,
  discovery_percentage numeric,
  total_xp integer,
  favorite_count integer,
  recent_artifacts jsonb,
  category_progress jsonb,
  rarity_counts jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with actor as (
    select auth.uid() as user_id
  ),
  active_items as (
    select i.*
    from public.items i
    join public.location_categories c on c.id = i.category_id
    where i.status = 'ACTIVE'
      and c.status = 'ACTIVE'
  ),
  owned as (
    select ui.*
    from public.user_inventory ui
    join actor a on a.user_id = ui.user_id
  ),
  totals as (
    select
      (select count(*) from active_items)::integer as total_items,
      (select count(*) from owned)::integer as owned_unique_items,
      (select coalesce(sum(quantity), 0) from owned)::integer as total_quantity,
      public.get_user_total_xp((select user_id from actor))::integer as total_xp,
      (
        select count(*)::integer
        from public.user_item_favorites f
        join actor a on a.user_id = f.user_id
      ) as favorite_count
  )
  select
    totals.total_items,
    totals.owned_unique_items,
    totals.total_quantity,
    case when totals.total_items = 0 then 0 else round((totals.owned_unique_items::numeric / totals.total_items::numeric) * 100, 2) end,
    totals.total_xp,
    totals.favorite_count,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'item_id', i.id,
          'name', i.name,
          'rarity', i.rarity,
          'image_key', i.image_key,
          'category_name', c.name,
          'quantity', ui.quantity,
          'first_found_at', ui.first_collected_at,
          'last_found_at', ui.last_collected_at,
          'is_favorite', f.item_id is not null
        )
        order by ui.last_collected_at desc
      )
      from owned ui
      join public.items i on i.id = ui.item_id
      join public.location_categories c on c.id = i.category_id
      left join public.user_item_favorites f on f.user_id = ui.user_id and f.item_id = i.id
      limit 6
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'category_id', c.id,
          'category_code', c.code,
          'category_name', c.name,
          'owned_unique_items', coalesce(progress.owned_count, 0),
          'total_items', coalesce(progress.total_count, 0),
          'discovery_percentage', case
            when coalesce(progress.total_count, 0) = 0 then 0
            else round((coalesce(progress.owned_count, 0)::numeric / progress.total_count::numeric) * 100, 2)
          end
        )
        order by c.name
      )
      from public.location_categories c
      left join lateral (
        select
          count(i.id)::integer as total_count,
          count(ui.item_id)::integer as owned_count
        from public.items i
        left join owned ui on ui.item_id = i.id
        where i.category_id = c.id
          and i.status = 'ACTIVE'
      ) progress on true
      where c.status = 'ACTIVE'
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'rarity', rarity_seed.rarity,
          'owned_unique_items', coalesce(owned_counts.owned_count, 0),
          'total_items', coalesce(total_counts.total_count, 0)
        )
        order by rarity_seed.display_order
      )
      from (
        values
          ('COMMON', 1),
          ('UNCOMMON', 2),
          ('RARE', 3),
          ('EPIC', 4),
          ('LEGENDARY', 5)
      ) as rarity_seed(rarity, display_order)
      left join lateral (
        select count(*)::integer as total_count
        from active_items i
        where i.rarity = rarity_seed.rarity
      ) total_counts on true
      left join lateral (
        select count(*)::integer as owned_count
        from owned ui
        join public.items i on i.id = ui.item_id
        where i.rarity = rarity_seed.rarity
      ) owned_counts on true
    ), '[]'::jsonb)
  from totals;
$$;

create or replace function public.get_inventory_listing(
  p_search text default null,
  p_category_id uuid default null,
  p_rarity text default null,
  p_ownership text default 'OWNED',
  p_sort text default 'RECENT',
  p_page integer default 1
)
returns table (
  item_id uuid,
  category_id uuid,
  category_code varchar,
  category_name varchar,
  rarity varchar,
  owned boolean,
  quantity integer,
  first_found_at timestamptz,
  last_found_at timestamptz,
  is_favorite boolean,
  display_name text,
  description text,
  image_key text,
  hint_text text,
  total_count integer,
  page integer,
  page_size integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  safe_page integer := greatest(coalesce(p_page, 1), 1);
  safe_search text := nullif(trim(coalesce(p_search, '')), '');
  safe_ownership text := coalesce(p_ownership, 'OWNED');
  safe_sort text := coalesce(p_sort, 'RECENT');
begin
  if actor_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_rarity is not null and p_rarity not in ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY') then
    raise exception 'INVENTORY_FILTER_INVALID';
  end if;

  if safe_ownership not in ('OWNED', 'UNOWNED', 'ALL', 'FAVORITES') then
    raise exception 'INVENTORY_FILTER_INVALID';
  end if;

  if safe_sort not in ('RECENT', 'FIRST_FOUND', 'NAME_ASC', 'RARITY_DESC', 'QUANTITY_DESC') then
    raise exception 'INVENTORY_SORT_INVALID';
  end if;

  return query
  with scoped as (
    select
      i.id as item_id,
      i.category_id,
      c.code as category_code,
      c.name as category_name,
      i.rarity,
      ui.id is not null as owned,
      coalesce(ui.quantity, 0)::integer as quantity,
      ui.first_collected_at as first_found_at,
      ui.last_collected_at as last_found_at,
      f.item_id is not null as is_favorite,
      i.name,
      i.description,
      i.image_key,
      case
        when ui.id is null then concat('Undiscovered ', c.name, ' artifact')
        else null
      end as hint_text
    from public.items i
    join public.location_categories c on c.id = i.category_id
    left join public.user_inventory ui on ui.item_id = i.id and ui.user_id = actor_id
    left join public.user_item_favorites f on f.item_id = i.id and f.user_id = actor_id
    where i.status = 'ACTIVE'
      and c.status = 'ACTIVE'
      and (p_category_id is null or i.category_id = p_category_id)
      and (p_rarity is null or i.rarity = p_rarity)
      and (
        safe_search is null
        or ui.id is not null and (
          i.name ilike '%' || safe_search || '%'
          or i.description ilike '%' || safe_search || '%'
          or c.name ilike '%' || safe_search || '%'
        )
      )
      and (
        safe_ownership = 'ALL'
        or (safe_ownership = 'OWNED' and ui.id is not null)
        or (safe_ownership = 'UNOWNED' and ui.id is null)
        or (safe_ownership = 'FAVORITES' and f.item_id is not null)
      )
  ),
  counted as (
    select scoped.*, count(*) over ()::integer as total_count
    from scoped
  )
  select
    counted.item_id,
    counted.category_id,
    counted.category_code,
    counted.category_name,
    counted.rarity,
    counted.owned,
    counted.quantity,
    counted.first_found_at,
    counted.last_found_at,
    counted.is_favorite,
    case when counted.owned then counted.name else 'Unknown Artifact' end as display_name,
    case when counted.owned then counted.description else null end as description,
    case when counted.owned then counted.image_key else null end as image_key,
    counted.hint_text,
    counted.total_count,
    safe_page,
    20
  from counted
  order by
    case when safe_sort = 'RECENT' then counted.last_found_at end desc nulls last,
    case when safe_sort = 'FIRST_FOUND' then counted.first_found_at end asc nulls last,
    case when safe_sort = 'NAME_ASC' and counted.owned then counted.name end asc nulls last,
    case
      when safe_sort = 'RARITY_DESC' and counted.rarity = 'LEGENDARY' then 5
      when safe_sort = 'RARITY_DESC' and counted.rarity = 'EPIC' then 4
      when safe_sort = 'RARITY_DESC' and counted.rarity = 'RARE' then 3
      when safe_sort = 'RARITY_DESC' and counted.rarity = 'UNCOMMON' then 2
      when safe_sort = 'RARITY_DESC' and counted.rarity = 'COMMON' then 1
      else 0
    end desc,
    case when safe_sort = 'QUANTITY_DESC' then counted.quantity end desc,
    counted.category_name asc,
    counted.item_id asc
  limit 20
  offset (safe_page - 1) * 20;
end;
$$;

create or replace function public.get_artifact_detail(p_item_id uuid)
returns table (
  item_id uuid,
  category_id uuid,
  category_code varchar,
  category_name varchar,
  rarity varchar,
  owned boolean,
  quantity integer,
  first_found_at timestamptz,
  last_found_at timestamptz,
  xp_earned integer,
  is_favorite boolean,
  display_name text,
  description text,
  image_key text,
  hint_text text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.id,
    i.category_id,
    c.code,
    c.name,
    i.rarity,
    ui.id is not null,
    coalesce(ui.quantity, 0)::integer,
    ui.first_collected_at,
    ui.last_collected_at,
    coalesce(xp.amount, 0)::integer,
    f.item_id is not null,
    case when ui.id is not null then i.name else 'Unknown Artifact' end,
    case when ui.id is not null then i.description else null end,
    case when ui.id is not null then i.image_key else null end,
    case when ui.id is null then concat('Find more ', c.name, ' memories to discover this artifact.') else null end
  from public.items i
  join public.location_categories c on c.id = i.category_id
  left join public.user_inventory ui on ui.item_id = i.id and ui.user_id = auth.uid()
  left join public.user_item_favorites f on f.item_id = i.id and f.user_id = auth.uid()
  left join lateral (
    select sum(rt.xp_awarded)::integer as amount
    from public.reward_transactions rt
    where rt.user_id = auth.uid()
      and rt.item_id = i.id
  ) xp on true
  where auth.uid() is not null
    and i.status = 'ACTIVE'
    and c.status = 'ACTIVE'
    and i.id = p_item_id;
$$;

create or replace function public.set_item_favorite(p_item_id uuid, p_favorite boolean)
returns table (
  item_id uuid,
  is_favorite boolean,
  favorite_count integer,
  error_code text,
  user_message text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  owned_exists boolean;
  current_count integer;
begin
  if actor_id is null then
    return query select p_item_id, false, 0, 'AUTH_REQUIRED', 'Sign in is required.';
    return;
  end if;

  select exists(
    select 1
    from public.user_inventory
    where user_id = actor_id
      and item_id = p_item_id
  ) into owned_exists;

  if not owned_exists then
    return query select p_item_id, false, 0, 'FAVORITE_ITEM_NOT_OWNED', 'Only discovered artifacts can be favorited.';
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(actor_id::text));

  if p_favorite then
    select count(*)::integer
    into current_count
    from public.user_item_favorites
    where user_id = actor_id;

    if current_count >= 20 and not exists (
      select 1 from public.user_item_favorites where user_id = actor_id and item_id = p_item_id
    ) then
      return query select p_item_id, false, current_count, 'FAVORITE_LIMIT_REACHED', 'You can favorite up to 20 artifacts.';
      return;
    end if;

    insert into public.user_item_favorites (user_id, item_id)
    values (actor_id, p_item_id)
    on conflict (user_id, item_id) do nothing;
  else
    delete from public.user_item_favorites
    where user_id = actor_id
      and item_id = p_item_id;
  end if;

  select count(*)::integer
  into current_count
  from public.user_item_favorites
  where user_id = actor_id;

  return query select p_item_id, p_favorite, current_count, null::text, case when p_favorite then 'Artifact favorited.' else 'Artifact removed from favorites.' end;
end;
$$;

revoke all on function public.get_inventory_dashboard() from public;
revoke all on function public.get_inventory_listing(text, uuid, text, text, text, integer) from public;
revoke all on function public.get_artifact_detail(uuid) from public;
revoke all on function public.set_item_favorite(uuid, boolean) from public;

grant execute on function public.get_inventory_dashboard() to authenticated;
grant execute on function public.get_inventory_listing(text, uuid, text, text, text, integer) to authenticated;
grant execute on function public.get_artifact_detail(uuid) to authenticated;
grant execute on function public.set_item_favorite(uuid, boolean) to authenticated;

create index if not exists user_item_favorites_user_created_at_idx on public.user_item_favorites (user_id, created_at desc);
create index if not exists user_inventory_user_last_collected_idx on public.user_inventory (user_id, last_collected_at desc);
create index if not exists items_status_category_rarity_idx on public.items (status, category_id, rarity);
