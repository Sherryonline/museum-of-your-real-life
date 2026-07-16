alter table public.xp_transactions drop constraint if exists xp_transactions_source_type_check;
alter table public.xp_transactions
  add constraint xp_transactions_source_type_check
  check (source_type in ('CHECK_IN_REWARD', 'DUPLICATE_ITEM', 'COLLECTION_COMPLETION'));

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code varchar(80) not null unique,
  name varchar(150) not null,
  description text not null,
  icon_key varchar(120) not null,
  rule_type varchar(40) not null check (rule_type in ('FIRST_MEMORY', 'FIRST_CATEGORY_CHECKIN', 'TOTAL_VALID_CHECKINS', 'UNIQUE_LOCATIONS', 'UNIQUE_CATEGORIES', 'COLLECTION_COMPLETED', 'WEEKEND_CHECKINS')),
  rule_value jsonb not null default '{}'::jsonb,
  status varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE'))
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  code varchar(80) not null unique,
  category_id uuid not null references public.location_categories(id),
  name varchar(150) not null,
  description text not null,
  completion_xp integer not null check (completion_xp >= 0),
  badge_id uuid references public.badges(id),
  display_order integer not null default 0,
  status varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  display_order integer not null default 0,
  primary key (collection_id, item_id)
);

create table if not exists public.user_collection_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  owned_unique_items integer not null default 0 check (owned_unique_items >= 0),
  required_unique_items integer not null default 0 check (required_unique_items >= 0),
  progress_percentage numeric(5,2) not null default 0 check (progress_percentage between 0 and 100),
  completion_status varchar(20) not null default 'IN_PROGRESS' check (completion_status in ('IN_PROGRESS', 'COMPLETED')),
  completed_at timestamptz,
  reward_granted_at timestamptz,
  unique (user_id, collection_id)
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  source_type varchar(40) not null check (source_type in ('FIRST_MEMORY', 'FIRST_CATEGORY_CHECKIN', 'TOTAL_VALID_CHECKINS', 'UNIQUE_LOCATIONS', 'UNIQUE_CATEGORIES', 'COLLECTION_COMPLETED', 'WEEKEND_CHECKINS')),
  source_id uuid,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table public.badges enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.user_collection_progress enable row level security;
alter table public.user_badges enable row level security;

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
before update on public.collections
for each row execute function public.set_updated_at();

insert into public.badges (code, name, description, icon_key, rule_type, rule_value, status)
values
  ('FIRST_MEMORY', 'First Memory', 'Create your first valid memory.', 'first-memory', 'FIRST_MEMORY', '{}', 'ACTIVE'),
  ('FIRST_COFFEE', 'First Coffee', 'Check in at a coffee location for the first time.', 'first-coffee', 'FIRST_CATEGORY_CHECKIN', '{"category_code": "COFFEE"}', 'ACTIVE'),
  ('FIVE_MEMORIES', 'Five Memories', 'Create five valid memories.', 'five-memories', 'TOTAL_VALID_CHECKINS', '{"count": 5}', 'ACTIVE'),
  ('TEN_UNIQUE_LOCATIONS', 'Ten Unique Locations', 'Check in at ten unique locations.', 'ten-locations', 'UNIQUE_LOCATIONS', '{"count": 10}', 'ACTIVE'),
  ('FIVE_CATEGORIES', 'Five Categories', 'Check in across five categories.', 'five-categories', 'UNIQUE_CATEGORIES', '{"count": 5}', 'ACTIVE'),
  ('COFFEE_EXPLORER', 'Coffee Explorer', 'Complete the coffee collection.', 'coffee-explorer', 'COLLECTION_COMPLETED', '{"category_code": "COFFEE"}', 'ACTIVE'),
  ('WEEKEND_WANDERER', 'Weekend Wanderer', 'Check in during a weekend.', 'weekend-wanderer', 'WEEKEND_CHECKINS', '{}', 'ACTIVE'),
  ('FIRST_COLLECTION', 'First Collection', 'Complete any collection.', 'first-collection', 'COLLECTION_COMPLETED', '{}', 'ACTIVE'),
  ('MUSEUM_BEGINNER', 'Museum Beginner', 'Make your first valid check-in.', 'museum-beginner', 'TOTAL_VALID_CHECKINS', '{"count": 1}', 'ACTIVE')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  icon_key = excluded.icon_key,
  rule_type = excluded.rule_type,
  rule_value = excluded.rule_value,
  status = excluded.status;

insert into public.collections (code, category_id, name, description, completion_xp, badge_id, display_order, status)
select
  concat(c.code, '_SPRINT_3_DEV_COLLECTION'),
  c.id,
  concat(c.name, ' Starter Collection'),
  concat('Development collection requiring unique ', c.name, ' reward items.'),
  100,
  case when c.code = 'COFFEE' then coffee_badge.id else first_collection_badge.id end,
  row_number() over (order by c.code),
  'ACTIVE'
from public.location_categories c
left join public.badges coffee_badge on coffee_badge.code = 'COFFEE_EXPLORER'
left join public.badges first_collection_badge on first_collection_badge.code = 'FIRST_COLLECTION'
where c.code in ('COFFEE', 'FOOD', 'CINEMA', 'SHOPPING', 'NATURE', 'CULTURE', 'TRAVEL', 'LIFESTYLE')
on conflict (code) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  completion_xp = excluded.completion_xp,
  badge_id = excluded.badge_id,
  display_order = excluded.display_order,
  status = excluded.status,
  updated_at = now();

insert into public.collection_items (collection_id, item_id, display_order)
select c.id, i.id, row_number() over (partition by c.id order by i.rarity, i.code)
from public.collections c
join public.items i on i.category_id = c.category_id
where c.code like '%_SPRINT_3_DEV_COLLECTION'
  and i.status = 'ACTIVE'
on conflict (collection_id, item_id) do update set
  display_order = excluded.display_order;

create or replace function public.validate_collection_item_category()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  collection_category uuid;
  item_category uuid;
begin
  select category_id into collection_category from public.collections where id = new.collection_id;
  select category_id into item_category from public.items where id = new.item_id;

  if collection_category is null or item_category is null or collection_category <> item_category then
    raise exception 'COLLECTION_ITEM_CATEGORY_MISMATCH';
  end if;

  return new;
end;
$$;

drop trigger if exists collection_items_validate_category on public.collection_items;
create trigger collection_items_validate_category
before insert or update on public.collection_items
for each row execute function public.validate_collection_item_category();

create or replace function public.evaluate_fixed_badges(p_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  badge_record record;
  should_award boolean;
  threshold integer;
  category_code text;
begin
  for badge_record in select * from public.badges where status = 'ACTIVE' loop
    should_award := false;
    threshold := coalesce((badge_record.rule_value->>'count')::integer, 1);
    category_code := badge_record.rule_value->>'category_code';

    if badge_record.rule_type = 'FIRST_MEMORY' then
      select exists(select 1 from public.memories where user_id = p_user_id) into should_award;
    elsif badge_record.rule_type = 'FIRST_CATEGORY_CHECKIN' then
      select exists(
        select 1
        from public.check_ins ci
        join public.locations l on l.id = ci.location_id
        join public.location_categories c on c.id = l.category_id
        where ci.user_id = p_user_id
          and ci.validation_status = 'VALID'
          and c.code = category_code
      ) into should_award;
    elsif badge_record.rule_type = 'TOTAL_VALID_CHECKINS' then
      select count(*) >= threshold
      from public.check_ins
      where user_id = p_user_id
        and validation_status = 'VALID'
      into should_award;
    elsif badge_record.rule_type = 'UNIQUE_LOCATIONS' then
      select count(distinct location_id) >= threshold
      from public.check_ins
      where user_id = p_user_id
        and validation_status = 'VALID'
      into should_award;
    elsif badge_record.rule_type = 'UNIQUE_CATEGORIES' then
      select count(distinct l.category_id) >= threshold
      from public.check_ins ci
      join public.locations l on l.id = ci.location_id
      where ci.user_id = p_user_id
        and ci.validation_status = 'VALID'
      into should_award;
    elsif badge_record.rule_type = 'COLLECTION_COMPLETED' then
      select exists(
        select 1
        from public.user_collection_progress ucp
        join public.collections col on col.id = ucp.collection_id
        join public.location_categories cat on cat.id = col.category_id
        where ucp.user_id = p_user_id
          and ucp.completion_status = 'COMPLETED'
          and (category_code is null or cat.code = category_code)
      ) into should_award;
    elsif badge_record.rule_type = 'WEEKEND_CHECKINS' then
      select exists(
        select 1
        from public.check_ins
        where user_id = p_user_id
          and validation_status = 'VALID'
          and extract(isodow from server_timestamp) in (6, 7)
      ) into should_award;
    end if;

    if should_award then
      insert into public.user_badges (user_id, badge_id, source_type, source_id)
      values (p_user_id, badge_record.id, badge_record.rule_type, null)
      on conflict (user_id, badge_id) do nothing;
    end if;
  end loop;
end;
$$;

create or replace function public.refresh_user_collection_progress_for_item(p_user_id uuid, p_item_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  collection_record record;
  required_count integer;
  owned_count integer;
  progress_percent numeric(5,2);
  progress_id uuid;
  was_completed boolean;
begin
  for collection_record in
    select distinct c.*
    from public.collections c
    join public.collection_items ci on ci.collection_id = c.id
    where ci.item_id = p_item_id
      and c.status = 'ACTIVE'
    for update
  loop
    select count(*) into required_count
    from public.collection_items
    where collection_id = collection_record.id;

    select count(distinct ui.item_id) into owned_count
    from public.collection_items ci
    join public.user_inventory ui on ui.item_id = ci.item_id and ui.user_id = p_user_id
    where ci.collection_id = collection_record.id;

    progress_percent := case when required_count = 0 then 0 else round((owned_count::numeric / required_count::numeric) * 100, 2) end;

    select id, completion_status = 'COMPLETED'
    into progress_id, was_completed
    from public.user_collection_progress
    where user_id = p_user_id
      and collection_id = collection_record.id
    for update;

    if progress_id is null then
      insert into public.user_collection_progress (
        user_id,
        collection_id,
        owned_unique_items,
        required_unique_items,
        progress_percentage,
        completion_status,
        completed_at,
        reward_granted_at
      )
      values (
        p_user_id,
        collection_record.id,
        owned_count,
        required_count,
        progress_percent,
        case when progress_percent >= 100 then 'COMPLETED' else 'IN_PROGRESS' end,
        case when progress_percent >= 100 then now() else null end,
        case when progress_percent >= 100 then now() else null end
      )
      returning id into progress_id;

      was_completed := false;
    else
      update public.user_collection_progress
      set owned_unique_items = owned_count,
        required_unique_items = required_count,
        progress_percentage = progress_percent,
        completion_status = case when progress_percent >= 100 then 'COMPLETED' else 'IN_PROGRESS' end,
        completed_at = case
          when progress_percent >= 100 and completed_at is null then now()
          else completed_at
        end,
        reward_granted_at = case
          when progress_percent >= 100 and reward_granted_at is null then now()
          else reward_granted_at
        end
      where id = progress_id;
    end if;

    if progress_percent >= 100 and not coalesce(was_completed, false) then
      insert into public.xp_transactions (user_id, source_type, source_id, amount, description)
      values (p_user_id, 'COLLECTION_COMPLETION', progress_id, collection_record.completion_xp, 'Collection completion XP')
      on conflict (source_type, source_id) do nothing;

      if collection_record.badge_id is not null then
        insert into public.user_badges (user_id, badge_id, source_type, source_id)
        values (p_user_id, collection_record.badge_id, 'COLLECTION_COMPLETED', collection_record.id)
        on conflict (user_id, badge_id) do nothing;
      end if;
    end if;
  end loop;

  perform public.evaluate_fixed_badges(p_user_id);
end;
$$;

create or replace function public.handle_new_unique_inventory_item()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.refresh_user_collection_progress_for_item(new.user_id, new.item_id);
  return new;
end;
$$;

drop trigger if exists user_inventory_refresh_collections on public.user_inventory;
create trigger user_inventory_refresh_collections
after insert on public.user_inventory
for each row execute function public.handle_new_unique_inventory_item();

create or replace function public.handle_badge_event()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.evaluate_fixed_badges(new.user_id);
  return new;
end;
$$;

drop trigger if exists check_ins_evaluate_badges on public.check_ins;
create trigger check_ins_evaluate_badges
after insert on public.check_ins
for each row execute function public.handle_badge_event();

drop trigger if exists memories_evaluate_badges on public.memories;
create trigger memories_evaluate_badges
after insert on public.memories
for each row execute function public.handle_badge_event();

create or replace function public.get_user_collections()
returns table (
  collection_id uuid,
  code varchar,
  name varchar,
  description text,
  category_code varchar,
  category_name varchar,
  completion_xp integer,
  badge_id uuid,
  badge_name varchar,
  display_order integer,
  owned_unique_items integer,
  required_unique_items integer,
  progress_percentage numeric,
  completion_status varchar,
  completed_at timestamptz,
  reward_granted_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.code,
    c.name,
    c.description,
    cat.code,
    cat.name,
    c.completion_xp,
    b.id,
    b.name,
    c.display_order,
    coalesce(ucp.owned_unique_items, 0),
    coalesce(ucp.required_unique_items, req.required_unique_items, 0),
    coalesce(ucp.progress_percentage, 0),
    coalesce(ucp.completion_status, 'IN_PROGRESS'),
    ucp.completed_at,
    ucp.reward_granted_at
  from public.collections c
  join public.location_categories cat on cat.id = c.category_id
  left join public.badges b on b.id = c.badge_id
  left join public.user_collection_progress ucp on ucp.collection_id = c.id and ucp.user_id = auth.uid()
  left join lateral (
    select count(*)::integer as required_unique_items
    from public.collection_items ci
    where ci.collection_id = c.id
  ) req on true
  where c.status = 'ACTIVE'
  order by c.display_order asc, c.name asc;
$$;

create or replace function public.get_collection_detail(p_collection_id uuid)
returns table (
  collection_id uuid,
  collection_name varchar,
  collection_description text,
  category_name varchar,
  completion_xp integer,
  badge_name varchar,
  owned_unique_items integer,
  required_unique_items integer,
  progress_percentage numeric,
  completion_status varchar,
  completed_at timestamptz,
  item_id uuid,
  item_name varchar,
  item_description text,
  rarity varchar,
  image_key varchar,
  owned boolean,
  quantity integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.name,
    c.description,
    cat.name,
    c.completion_xp,
    b.name,
    coalesce(ucp.owned_unique_items, 0),
    coalesce(ucp.required_unique_items, req.required_unique_items, 0),
    coalesce(ucp.progress_percentage, 0),
    coalesce(ucp.completion_status, 'IN_PROGRESS'),
    ucp.completed_at,
    i.id,
    i.name,
    i.description,
    i.rarity,
    i.image_key,
    ui.id is not null,
    coalesce(ui.quantity, 0)
  from public.collections c
  join public.location_categories cat on cat.id = c.category_id
  left join public.badges b on b.id = c.badge_id
  left join public.user_collection_progress ucp on ucp.collection_id = c.id and ucp.user_id = auth.uid()
  left join lateral (
    select count(*)::integer as required_unique_items
    from public.collection_items ci
    where ci.collection_id = c.id
  ) req on true
  join public.collection_items ci on ci.collection_id = c.id
  join public.items i on i.id = ci.item_id
  left join public.user_inventory ui on ui.user_id = auth.uid() and ui.item_id = i.id
  where c.status = 'ACTIVE'
    and c.id = p_collection_id
  order by ci.display_order asc, i.name asc;
$$;

create or replace function public.get_user_badges()
returns table (
  badge_id uuid,
  code varchar,
  name varchar,
  description text,
  icon_key varchar,
  rule_type varchar,
  rule_value jsonb,
  earned boolean,
  awarded_at timestamptz,
  progress_hint text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.code,
    b.name,
    b.description,
    b.icon_key,
    b.rule_type,
    b.rule_value,
    ub.id is not null,
    ub.awarded_at,
    case
      when ub.id is not null then 'Earned'
      when b.rule_type = 'TOTAL_VALID_CHECKINS' then concat('Reach ', coalesce(b.rule_value->>'count', '1'), ' valid check-ins')
      when b.rule_type = 'UNIQUE_LOCATIONS' then concat('Visit ', coalesce(b.rule_value->>'count', '1'), ' unique locations')
      when b.rule_type = 'UNIQUE_CATEGORIES' then concat('Visit ', coalesce(b.rule_value->>'count', '1'), ' categories')
      when b.rule_type = 'COLLECTION_COMPLETED' then 'Complete a matching collection'
      when b.rule_type = 'FIRST_CATEGORY_CHECKIN' then 'Complete the matching category check-in'
      when b.rule_type = 'WEEKEND_CHECKINS' then 'Check in on a weekend'
      else 'Keep exploring'
    end
  from public.badges b
  left join public.user_badges ub on ub.badge_id = b.id and ub.user_id = auth.uid()
  where b.status = 'ACTIVE'
  order by (ub.id is not null) desc, b.name asc;
$$;

revoke all on public.badges from anon, authenticated;
revoke all on public.collections from anon, authenticated;
revoke all on public.collection_items from anon, authenticated;
revoke all on public.user_collection_progress from anon, authenticated;
revoke all on public.user_badges from anon, authenticated;

grant select on public.badges to authenticated;
grant select on public.collections to authenticated;
grant select on public.collection_items to authenticated;
grant select on public.user_collection_progress to authenticated;
grant select on public.user_badges to authenticated;
grant select, insert, update, delete on public.badges to authenticated;
grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public.collection_items to authenticated;

revoke all on function public.get_user_collections() from public;
revoke all on function public.get_collection_detail(uuid) from public;
revoke all on function public.get_user_badges() from public;
grant execute on function public.get_user_collections() to authenticated;
grant execute on function public.get_collection_detail(uuid) to authenticated;
grant execute on function public.get_user_badges() to authenticated;

drop policy if exists "badges_select_active_or_admin" on public.badges;
create policy "badges_select_active_or_admin"
on public.badges for select
to authenticated
using (status = 'ACTIVE' or public.is_admin());

drop policy if exists "collections_select_active_or_admin" on public.collections;
create policy "collections_select_active_or_admin"
on public.collections for select
to authenticated
using (status = 'ACTIVE' or public.is_admin());

drop policy if exists "collection_items_select_active_collection_or_admin" on public.collection_items;
create policy "collection_items_select_active_collection_or_admin"
on public.collection_items for select
to authenticated
using (
  exists(select 1 from public.collections c where c.id = collection_id and c.status = 'ACTIVE')
  or public.is_admin()
);

drop policy if exists "user_collection_progress_select_own_or_admin" on public.user_collection_progress;
create policy "user_collection_progress_select_own_or_admin"
on public.user_collection_progress for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_badges_select_own_or_admin" on public.user_badges;
create policy "user_badges_select_own_or_admin"
on public.user_badges for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "badges_admin_all" on public.badges;
create policy "badges_admin_all"
on public.badges for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "collections_admin_all" on public.collections;
create policy "collections_admin_all"
on public.collections for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "collection_items_admin_all" on public.collection_items;
create policy "collection_items_admin_all"
on public.collection_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists collections_category_order_idx on public.collections (category_id, display_order);
create index if not exists user_collection_progress_user_idx on public.user_collection_progress (user_id, completion_status);
create index if not exists user_badges_user_awarded_idx on public.user_badges (user_id, awarded_at desc);
