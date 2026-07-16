create table if not exists public.user_discovered_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  first_discovered_at timestamptz not null default now(),
  last_discovered_at timestamptz not null default now(),
  discover_count integer not null default 1 check (discover_count > 0),
  unique (user_id, item_id)
);

alter table public.user_discovered_items enable row level security;

insert into public.user_discovered_items (
  user_id,
  item_id,
  first_discovered_at,
  last_discovered_at,
  discover_count
)
select
  ui.user_id,
  ui.item_id,
  ui.first_collected_at,
  ui.last_collected_at,
  greatest(ui.quantity, 1)
from public.user_inventory ui
on conflict (user_id, item_id) do update set
  first_discovered_at = least(public.user_discovered_items.first_discovered_at, excluded.first_discovered_at),
  last_discovered_at = greatest(public.user_discovered_items.last_discovered_at, excluded.last_discovered_at),
  discover_count = greatest(public.user_discovered_items.discover_count, excluded.discover_count);

create or replace function public.record_item_discovery_from_reward()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  insert into public.user_discovered_items (
    user_id,
    item_id,
    first_discovered_at,
    last_discovered_at,
    discover_count
  )
  values (
    new.user_id,
    new.item_id,
    new.created_at,
    new.created_at,
    greatest(new.item_quantity, 1)
  )
  on conflict (user_id, item_id) do update set
    last_discovered_at = greatest(public.user_discovered_items.last_discovered_at, excluded.last_discovered_at),
    discover_count = public.user_discovered_items.discover_count + greatest(excluded.discover_count, 1);

  return new;
end;
$$;

drop trigger if exists reward_transactions_record_discovery on public.reward_transactions;
create trigger reward_transactions_record_discovery
after insert on public.reward_transactions
for each row execute function public.record_item_discovery_from_reward();

create or replace function public.get_inventory_book(
  p_category_id uuid default null,
  p_page integer default 1
)
returns table (
  item_id uuid,
  category_id uuid,
  category_code varchar,
  category_name varchar,
  artifact_state text,
  display_name text,
  display_rarity varchar,
  image_key text,
  discovery_date timestamptz,
  quantity integer,
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
begin
  if actor_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  return query
  with scoped as (
    select
      i.id,
      i.category_id,
      c.code as category_code,
      c.name as category_name,
      udi.id is not null as discovered,
      i.name,
      i.rarity,
      i.image_key,
      udi.first_discovered_at,
      coalesce(ui.quantity, 0)::integer as quantity
    from public.items i
    join public.location_categories c on c.id = i.category_id
    left join public.user_discovered_items udi on udi.item_id = i.id and udi.user_id = actor_id
    left join public.user_inventory ui on ui.item_id = i.id and ui.user_id = actor_id
    where i.status = 'ACTIVE'
      and c.status = 'ACTIVE'
      and (p_category_id is null or i.category_id = p_category_id)
  ),
  counted as (
    select scoped.*, count(*) over ()::integer as total_count
    from scoped
  )
  select
    counted.id,
    counted.category_id,
    counted.category_code,
    counted.category_name,
    case when counted.discovered then 'COLLECTED' else 'UNKNOWN' end,
    case when counted.discovered then counted.name else 'Unknown Artifact' end,
    case when counted.discovered then counted.rarity else null end,
    case when counted.discovered then counted.image_key else null end,
    counted.first_discovered_at,
    counted.quantity,
    case when counted.discovered then null else 'Visit more places to discover this artifact.' end,
    counted.total_count,
    safe_page,
    24
  from counted
  order by counted.category_name asc, counted.discovered desc, counted.first_discovered_at asc nulls last, counted.id asc
  limit 24
  offset (safe_page - 1) * 24;
end;
$$;

create or replace function public.get_inventory_progress()
returns table (
  owned_unique_items integer,
  total_items integer,
  discovery_percentage numeric,
  category_progress jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with active_items as (
    select i.*
    from public.items i
    join public.location_categories c on c.id = i.category_id
    where i.status = 'ACTIVE'
      and c.status = 'ACTIVE'
  ),
  discovered as (
    select udi.*
    from public.user_discovered_items udi
    where udi.user_id = auth.uid()
  ),
  totals as (
    select
      (select count(*) from discovered d join active_items i on i.id = d.item_id)::integer as owned_unique_items,
      (select count(*) from active_items)::integer as total_items
  )
  select
    totals.owned_unique_items,
    totals.total_items,
    case when totals.total_items = 0 then 0 else round((totals.owned_unique_items::numeric / totals.total_items::numeric) * 100, 2) end,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'category_id', c.id,
          'category_code', c.code,
          'category_name', c.name,
          'owned_unique_items', coalesce(cp.owned_count, 0),
          'total_items', coalesce(cp.total_count, 0),
          'discovery_percentage', case
            when coalesce(cp.total_count, 0) = 0 then 0
            else round((coalesce(cp.owned_count, 0)::numeric / cp.total_count::numeric) * 100, 2)
          end
        )
        order by c.name
      )
      from public.location_categories c
      left join lateral (
        select
          count(i.id)::integer as total_count,
          count(d.item_id)::integer as owned_count
        from public.items i
        left join discovered d on d.item_id = i.id
        where i.category_id = c.id
          and i.status = 'ACTIVE'
      ) cp on true
      where c.status = 'ACTIVE'
    ), '[]'::jsonb)
  from totals;
$$;

create or replace function public.get_inventory_statistics()
returns table (
  total_artifacts integer,
  unique_artifacts integer,
  duplicate_artifacts integer,
  discovery_percentage numeric,
  favorite_category text,
  most_collected_artifact text,
  oldest_artifact text,
  newest_artifact text
)
language sql
stable
security definer
set search_path = public
as $$
  with active_items as (
    select i.*
    from public.items i
    join public.location_categories c on c.id = i.category_id
    where i.status = 'ACTIVE'
      and c.status = 'ACTIVE'
  ),
  discovered as (
    select udi.*, i.name, i.category_id, c.name as category_name
    from public.user_discovered_items udi
    join public.items i on i.id = udi.item_id
    join public.location_categories c on c.id = i.category_id
    where udi.user_id = auth.uid()
      and i.status = 'ACTIVE'
      and c.status = 'ACTIVE'
  ),
  totals as (
    select
      (select count(*) from active_items)::integer as total_artifacts,
      (select count(*) from discovered)::integer as unique_artifacts,
      (select coalesce(sum(greatest(discover_count - 1, 0)), 0) from discovered)::integer as duplicate_artifacts
  )
  select
    totals.total_artifacts,
    totals.unique_artifacts,
    totals.duplicate_artifacts,
    case when totals.total_artifacts = 0 then 0 else round((totals.unique_artifacts::numeric / totals.total_artifacts::numeric) * 100, 2) end,
    (
      select category_name
      from discovered
      group by category_name
      order by sum(discover_count) desc, category_name asc
      limit 1
    ),
    (
      select name
      from discovered
      order by discover_count desc, name asc
      limit 1
    ),
    (
      select name
      from discovered
      order by first_discovered_at asc, name asc
      limit 1
    ),
    (
      select name
      from discovered
      order by first_discovered_at desc, name asc
      limit 1
    )
  from totals;
$$;

create or replace function public.get_inventory_recommendations()
returns table (
  recommendation_type text,
  category_id uuid,
  category_name text,
  owned_unique_items integer,
  total_items integer,
  remaining_items integer,
  message text
)
language sql
stable
security definer
set search_path = public
as $$
  with progress as (
    select
      c.id as category_id,
      c.name as category_name,
      count(i.id)::integer as total_items,
      count(udi.item_id)::integer as owned_unique_items
    from public.location_categories c
    join public.items i on i.category_id = c.id and i.status = 'ACTIVE'
    left join public.user_discovered_items udi on udi.item_id = i.id and udi.user_id = auth.uid()
    where c.status = 'ACTIVE'
    group by c.id, c.name
  ),
  ranked_lowest as (
    select *
    from progress
    where total_items > 0
    order by (owned_unique_items::numeric / total_items::numeric) asc, category_name asc
    limit 1
  ),
  ranked_closest as (
    select *
    from progress
    where total_items > 0
      and owned_unique_items < total_items
    order by (total_items - owned_unique_items) asc, category_name asc
    limit 1
  )
  select
    'LOWEST_COMPLETION',
    category_id,
    category_name,
    owned_unique_items,
    total_items,
    total_items - owned_unique_items,
    concat('Explore ', category_name, ': ', owned_unique_items, ' / ', total_items, ' artifacts discovered.')
  from ranked_lowest
  union all
  select
    'CLOSEST_TO_COMPLETION',
    category_id,
    category_name,
    owned_unique_items,
    total_items,
    total_items - owned_unique_items,
    concat('Only ', total_items - owned_unique_items, ' artifacts remaining in ', category_name, '.')
  from ranked_closest;
$$;

create or replace function public.get_artifact_timeline(p_item_id uuid)
returns table (
  location_name varchar,
  visit_date timestamptz,
  memory_title varchar,
  check_in_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.name,
    ci.server_timestamp,
    m.title,
    ci.id
  from public.reward_transactions rt
  join public.check_ins ci on ci.id = rt.check_in_id
  join public.locations l on l.id = ci.location_id
  left join public.memories m on m.check_in_id = ci.id and m.user_id = rt.user_id
  where rt.user_id = auth.uid()
    and rt.item_id = p_item_id
  order by ci.server_timestamp desc
  limit 20;
$$;

revoke all on public.user_discovered_items from anon, authenticated;
grant select on public.user_discovered_items to authenticated;

drop policy if exists "user_discovered_items_select_own_or_admin" on public.user_discovered_items;
create policy "user_discovered_items_select_own_or_admin"
on public.user_discovered_items for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

revoke all on function public.get_inventory_book(uuid, integer) from public;
revoke all on function public.get_inventory_progress() from public;
revoke all on function public.get_inventory_statistics() from public;
revoke all on function public.get_inventory_recommendations() from public;
revoke all on function public.get_artifact_timeline(uuid) from public;

grant execute on function public.get_inventory_book(uuid, integer) to authenticated;
grant execute on function public.get_inventory_progress() to authenticated;
grant execute on function public.get_inventory_statistics() to authenticated;
grant execute on function public.get_inventory_recommendations() to authenticated;
grant execute on function public.get_artifact_timeline(uuid) to authenticated;

create index if not exists user_discovered_items_user_last_idx on public.user_discovered_items (user_id, last_discovered_at desc);
create index if not exists user_discovered_items_user_item_idx on public.user_discovered_items (user_id, item_id);
