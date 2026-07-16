alter table public.check_ins drop constraint if exists check_ins_reward_status_check;
alter table public.check_ins
  add constraint check_ins_reward_status_check
  check (reward_status in ('NOT_APPLICABLE', 'PENDING', 'GRANTED', 'BLOCKED'));

update public.check_ins
set reward_status = 'PENDING'
where validation_status = 'VALID'
  and reward_status = 'NOT_APPLICABLE';

create or replace function public.set_pending_reward_for_valid_check_in()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.validation_status = 'VALID' and new.reward_status = 'NOT_APPLICABLE' then
    new.reward_status = 'PENDING';
  end if;

  return new;
end;
$$;

drop trigger if exists check_ins_set_pending_reward on public.check_ins;
create trigger check_ins_set_pending_reward
before insert or update on public.check_ins
for each row execute function public.set_pending_reward_for_valid_check_in();

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  code varchar(80) not null unique,
  category_id uuid not null references public.location_categories(id),
  name varchar(150) not null,
  description text not null,
  rarity varchar(20) not null check (rarity in ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY')),
  image_key varchar(120) not null,
  base_xp integer not null check (base_xp > 0),
  status varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loot_tables (
  id uuid primary key default gen_random_uuid(),
  code varchar(80) not null unique,
  category_id uuid not null references public.location_categories(id),
  name varchar(150) not null,
  version integer not null check (version > 0),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  status varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now()
);

create unique index if not exists loot_tables_one_active_open_version_idx
on public.loot_tables (category_id)
where status = 'ACTIVE' and effective_to is null;

create table if not exists public.loot_table_items (
  id uuid primary key default gen_random_uuid(),
  loot_table_id uuid not null references public.loot_tables(id) on delete cascade,
  item_id uuid not null references public.items(id),
  weight integer not null check (weight > 0),
  status varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  unique (loot_table_id, item_id)
);

create table if not exists public.reward_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_id uuid not null unique references public.check_ins(id) on delete cascade,
  loot_table_id uuid not null references public.loot_tables(id),
  loot_table_version integer not null,
  item_id uuid not null references public.items(id),
  rarity varchar(20) not null check (rarity in ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY')),
  item_quantity integer not null default 1 check (item_quantity > 0),
  xp_awarded integer not null check (xp_awarded >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id),
  quantity integer not null check (quantity > 0),
  first_collected_at timestamptz not null default now(),
  last_collected_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create table if not exists public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type varchar(40) not null check (source_type in ('CHECK_IN_REWARD', 'DUPLICATE_ITEM')),
  source_id uuid not null,
  amount integer not null check (amount >= 0),
  description text not null,
  created_at timestamptz not null default now(),
  unique (source_type, source_id)
);

create table if not exists public.level_configurations (
  level integer primary key check (level > 0),
  required_total_xp integer not null unique check (required_total_xp >= 0),
  title varchar(100) not null,
  status varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE'))
);

alter table public.items enable row level security;
alter table public.loot_tables enable row level security;
alter table public.loot_table_items enable row level security;
alter table public.reward_transactions enable row level security;
alter table public.user_inventory enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.level_configurations enable row level security;

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
before update on public.items
for each row execute function public.set_updated_at();

insert into public.app_configurations (config_key, config_value, description, status)
values
  ('DUPLICATE_ITEM_XP', '{"value": 5, "seed": "development"}', 'XP granted when a reward item is already owned.', 'ACTIVE')
on conflict (config_key) do update set
  config_value = excluded.config_value,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.level_configurations (level, required_total_xp, title, status)
values
  (1, 0, 'Visitor', 'ACTIVE'),
  (2, 50, 'Regular', 'ACTIVE'),
  (3, 125, 'Collector', 'ACTIVE'),
  (4, 250, 'Archivist', 'ACTIVE'),
  (5, 450, 'Curator', 'ACTIVE'),
  (6, 750, 'Guide', 'ACTIVE'),
  (7, 1100, 'Historian', 'ACTIVE'),
  (8, 1550, 'Keeper', 'ACTIVE'),
  (9, 2100, 'Patron', 'ACTIVE'),
  (10, 3000, 'Legend', 'ACTIVE')
on conflict (level) do update set
  required_total_xp = excluded.required_total_xp,
  title = excluded.title,
  status = excluded.status;

insert into public.items (code, category_id, name, description, rarity, image_key, base_xp, status)
select
  concat(c.code, '_', r.rarity, '_DEV_ITEM') as code,
  c.id,
  concat(initcap(lower(c.name)), ' ', initcap(lower(r.rarity)), ' Keepsake') as name,
  concat('Development seed reward for ', c.name, ' check-ins.') as description,
  r.rarity,
  concat(lower(c.code), '_', lower(r.rarity), '_keepsake') as image_key,
  r.base_xp,
  'ACTIVE'
from public.location_categories c
cross join (
  values
    ('COMMON', 10),
    ('UNCOMMON', 20),
    ('RARE', 40),
    ('EPIC', 80),
    ('LEGENDARY', 160)
) as r(rarity, base_xp)
where c.code in ('COFFEE', 'FOOD', 'CINEMA', 'SHOPPING', 'NATURE', 'CULTURE', 'TRAVEL', 'LIFESTYLE')
on conflict (code) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  rarity = excluded.rarity,
  image_key = excluded.image_key,
  base_xp = excluded.base_xp,
  status = excluded.status,
  updated_at = now();

insert into public.loot_tables (code, category_id, name, version, effective_from, effective_to, status)
select
  concat(c.code, '_SPRINT_2_DEV_LOOT') as code,
  c.id,
  concat(c.name, ' Development Loot Table') as name,
  1,
  '2026-01-01T00:00:00Z'::timestamptz,
  null,
  'ACTIVE'
from public.location_categories c
where c.code in ('COFFEE', 'FOOD', 'CINEMA', 'SHOPPING', 'NATURE', 'CULTURE', 'TRAVEL', 'LIFESTYLE')
on conflict (code) do update set
  name = excluded.name,
  version = excluded.version,
  effective_from = excluded.effective_from,
  effective_to = excluded.effective_to,
  status = excluded.status;

insert into public.loot_table_items (loot_table_id, item_id, weight, status)
select lt.id, i.id,
  case i.rarity
    when 'COMMON' then 60
    when 'UNCOMMON' then 25
    when 'RARE' then 10
    when 'EPIC' then 4
    when 'LEGENDARY' then 1
    else 1
  end as weight,
  'ACTIVE'
from public.loot_tables lt
join public.items i on i.category_id = lt.category_id
where lt.code like '%_SPRINT_2_DEV_LOOT'
on conflict (loot_table_id, item_id) do update set
  weight = excluded.weight,
  status = excluded.status;

create or replace function public.get_user_total_xp(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)::integer
  from public.xp_transactions
  where user_id = p_user_id;
$$;

create or replace function public.get_level_for_xp(p_total_xp integer)
returns table (
  level integer,
  title varchar,
  required_total_xp integer
)
language sql
stable
security definer
set search_path = public
as $$
  select lc.level, lc.title, lc.required_total_xp
  from public.level_configurations lc
  where lc.status = 'ACTIVE'
    and lc.required_total_xp <= p_total_xp
  order by lc.required_total_xp desc
  limit 1;
$$;

create or replace function public.open_check_in_reward(p_check_in_id uuid)
returns table (
  reward_transaction_id uuid,
  check_in_id uuid,
  item_id uuid,
  item_code varchar,
  item_name varchar,
  item_description text,
  rarity varchar,
  image_key varchar,
  xp_awarded integer,
  duplicate boolean,
  inventory_quantity integer,
  total_xp integer,
  level integer,
  level_title varchar,
  reward_status varchar,
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
  check_in_record record;
  existing_reward record;
  loot_table_record record;
  selected_item record;
  existing_inventory public.user_inventory%rowtype;
  reward_id uuid;
  duplicate_item boolean := false;
  granted_xp integer;
  duplicate_xp integer;
  new_quantity integer := 1;
  total_weight integer;
  roll numeric;
  total_xp_value integer;
  level_record record;
begin
  if actor_id is null then
    return query select null::uuid, p_check_in_id, null::uuid, null::varchar, null::varchar, null::text, null::varchar, null::varchar, 0, false, 0, 0, 1, 'Visitor'::varchar, 'NOT_APPLICABLE'::varchar, 'REWARD_AUTH_REQUIRED', 'Sign in is required to open a reward.';
    return;
  end if;

  select rt.*, i.code as item_code, i.name as item_name, i.description as item_description, i.image_key, ui.quantity
  into existing_reward
  from public.reward_transactions rt
  join public.items i on i.id = rt.item_id
  join public.user_inventory ui on ui.user_id = rt.user_id and ui.item_id = rt.item_id
  where rt.user_id = actor_id
    and rt.check_in_id = p_check_in_id;

  if found then
    total_xp_value := public.get_user_total_xp(actor_id);
    select * into level_record from public.get_level_for_xp(total_xp_value);
    return query select existing_reward.id, existing_reward.check_in_id, existing_reward.item_id, existing_reward.item_code, existing_reward.item_name, existing_reward.item_description, existing_reward.rarity, existing_reward.image_key, existing_reward.xp_awarded, false, existing_reward.quantity, total_xp_value, level_record.level, level_record.title, 'GRANTED'::varchar, null::text, 'Reward already opened.';
    return;
  end if;

  select ci.*, l.category_id
  into check_in_record
  from public.check_ins ci
  join public.locations l on l.id = ci.location_id
  where ci.id = p_check_in_id
    and ci.user_id = actor_id
  for update;

  if not found then
    return query select null::uuid, p_check_in_id, null::uuid, null::varchar, null::varchar, null::text, null::varchar, null::varchar, 0, false, 0, 0, 1, 'Visitor'::varchar, 'NOT_APPLICABLE'::varchar, 'REWARD_CHECKIN_NOT_FOUND', 'The check-in is not available.';
    return;
  end if;

  if check_in_record.validation_status <> 'VALID' then
    return query select null::uuid, p_check_in_id, null::uuid, null::varchar, null::varchar, null::text, null::varchar, null::varchar, 0, false, 0, 0, 1, 'Visitor'::varchar, check_in_record.reward_status, 'REWARD_UNAVAILABLE', 'This check-in is not eligible for a reward.';
    return;
  end if;

  if check_in_record.reward_status = 'GRANTED' then
    return query select null::uuid, p_check_in_id, null::uuid, null::varchar, null::varchar, null::text, null::varchar, null::varchar, 0, false, 0, 0, 1, 'Visitor'::varchar, 'GRANTED'::varchar, 'REWARD_ALREADY_GRANTED', 'Reward already opened.';
    return;
  end if;

  if check_in_record.reward_status <> 'PENDING' then
    return query select null::uuid, p_check_in_id, null::uuid, null::varchar, null::varchar, null::text, null::varchar, null::varchar, 0, false, 0, 0, 1, 'Visitor'::varchar, check_in_record.reward_status, 'REWARD_UNAVAILABLE', 'This check-in is not eligible for a reward.';
    return;
  end if;

  select *
  into loot_table_record
  from public.loot_tables
  where category_id = check_in_record.category_id
    and status = 'ACTIVE'
    and effective_from <= now()
    and (effective_to is null or effective_to > now())
  order by version desc
  limit 1;

  if not found then
    return query select null::uuid, p_check_in_id, null::uuid, null::varchar, null::varchar, null::text, null::varchar, null::varchar, 0, false, 0, 0, 1, 'Visitor'::varchar, 'PENDING'::varchar, 'REWARD_NO_ACTIVE_LOOT_TABLE', 'Reward is not available for this location yet.';
    return;
  end if;

  select sum(lti.weight)
  into total_weight
  from public.loot_table_items lti
  join public.items i on i.id = lti.item_id
  where lti.loot_table_id = loot_table_record.id
    and lti.status = 'ACTIVE'
    and i.status = 'ACTIVE';

  if total_weight is null or total_weight <= 0 then
    return query select null::uuid, p_check_in_id, null::uuid, null::varchar, null::varchar, null::text, null::varchar, null::varchar, 0, false, 0, 0, 1, 'Visitor'::varchar, 'PENDING'::varchar, 'REWARD_NO_ACTIVE_LOOT_TABLE', 'Reward is not available for this location yet.';
    return;
  end if;

  roll := random() * total_weight;

  select *
  into selected_item
  from (
    select
      i.*,
      sum(lti.weight) over (order by i.rarity, i.code) as cumulative_weight
    from public.loot_table_items lti
    join public.items i on i.id = lti.item_id
    where lti.loot_table_id = loot_table_record.id
      and lti.status = 'ACTIVE'
      and i.status = 'ACTIVE'
  ) weighted
  where weighted.cumulative_weight >= roll
  order by weighted.cumulative_weight asc
  limit 1;

  if not found then
    return query select null::uuid, p_check_in_id, null::uuid, null::varchar, null::varchar, null::text, null::varchar, null::varchar, 0, false, 0, 0, 1, 'Visitor'::varchar, 'PENDING'::varchar, 'REWARD_NO_ACTIVE_ITEM', 'Reward is not available for this location yet.';
    return;
  end if;

  select *
  into existing_inventory
  from public.user_inventory
  where user_id = actor_id
    and item_id = selected_item.id
  for update;

  duplicate_item := found;
  duplicate_xp := coalesce(public.get_config_number('DUPLICATE_ITEM_XP')::integer, 5);
  granted_xp := case when duplicate_item then duplicate_xp else selected_item.base_xp end;

  insert into public.reward_transactions (
    user_id,
    check_in_id,
    loot_table_id,
    loot_table_version,
    item_id,
    rarity,
    item_quantity,
    xp_awarded
  )
  values (
    actor_id,
    p_check_in_id,
    loot_table_record.id,
    loot_table_record.version,
    selected_item.id,
    selected_item.rarity,
    1,
    granted_xp
  )
  returning id into reward_id;

  if duplicate_item then
    update public.user_inventory
    set quantity = quantity + 1,
      last_collected_at = now()
    where id = existing_inventory.id
    returning quantity into new_quantity;
  else
    insert into public.user_inventory (user_id, item_id, quantity, first_collected_at, last_collected_at)
    values (actor_id, selected_item.id, 1, now(), now())
    returning quantity into new_quantity;
  end if;

  insert into public.xp_transactions (user_id, source_type, source_id, amount, description)
  values (
    actor_id,
    case when duplicate_item then 'DUPLICATE_ITEM' else 'CHECK_IN_REWARD' end,
    reward_id,
    granted_xp,
    case when duplicate_item then 'Duplicate item reward XP' else 'Check-in reward XP' end
  );

  update public.check_ins
  set reward_status = 'GRANTED'
  where id = p_check_in_id;

  total_xp_value := public.get_user_total_xp(actor_id);
  select * into level_record from public.get_level_for_xp(total_xp_value);

  return query select reward_id, p_check_in_id, selected_item.id, selected_item.code, selected_item.name, selected_item.description, selected_item.rarity, selected_item.image_key, granted_xp, duplicate_item, new_quantity, total_xp_value, level_record.level, level_record.title, 'GRANTED'::varchar, null::text, 'Reward opened.';
end;
$$;

create or replace function public.get_check_in_reward(p_check_in_id uuid)
returns table (
  reward_transaction_id uuid,
  check_in_id uuid,
  item_id uuid,
  item_code varchar,
  item_name varchar,
  item_description text,
  rarity varchar,
  image_key varchar,
  xp_awarded integer,
  duplicate boolean,
  inventory_quantity integer,
  total_xp integer,
  level integer,
  level_title varchar,
  reward_status varchar,
  error_code text,
  user_message text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    rt.id,
    rt.check_in_id,
    i.id,
    i.code,
    i.name,
    i.description,
    i.rarity,
    i.image_key,
    rt.xp_awarded,
    false,
    ui.quantity,
    public.get_user_total_xp(rt.user_id),
    lvl.level,
    lvl.title,
    ci.reward_status,
    null::text,
    'Reward already opened.'::text
  from public.reward_transactions rt
  join public.check_ins ci on ci.id = rt.check_in_id
  join public.items i on i.id = rt.item_id
  join public.user_inventory ui on ui.user_id = rt.user_id and ui.item_id = rt.item_id
  cross join lateral public.get_level_for_xp(public.get_user_total_xp(rt.user_id)) lvl
  where rt.user_id = auth.uid()
    and rt.check_in_id = p_check_in_id;
$$;

create or replace function public.get_user_inventory()
returns table (
  inventory_id uuid,
  item_id uuid,
  item_code varchar,
  item_name varchar,
  item_description text,
  rarity varchar,
  image_key varchar,
  category_code varchar,
  category_name varchar,
  quantity integer,
  first_collected_at timestamptz,
  last_collected_at timestamptz,
  total_xp integer,
  level integer,
  level_title varchar
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ui.id,
    i.id,
    i.code,
    i.name,
    i.description,
    i.rarity,
    i.image_key,
    c.code,
    c.name,
    ui.quantity,
    ui.first_collected_at,
    ui.last_collected_at,
    public.get_user_total_xp(ui.user_id),
    lvl.level,
    lvl.title
  from public.user_inventory ui
  join public.items i on i.id = ui.item_id
  join public.location_categories c on c.id = i.category_id
  cross join lateral public.get_level_for_xp(public.get_user_total_xp(ui.user_id)) lvl
  where ui.user_id = auth.uid()
  order by ui.last_collected_at desc;
$$;

revoke all on public.items from anon, authenticated;
revoke all on public.loot_tables from anon, authenticated;
revoke all on public.loot_table_items from anon, authenticated;
revoke all on public.reward_transactions from anon, authenticated;
revoke all on public.user_inventory from anon, authenticated;
revoke all on public.xp_transactions from anon, authenticated;
revoke all on public.level_configurations from anon, authenticated;

grant select on public.items to authenticated;
grant select on public.level_configurations to authenticated;
grant select on public.reward_transactions to authenticated;
grant select on public.user_inventory to authenticated;
grant select on public.xp_transactions to authenticated;
grant select, insert, update, delete on public.items to authenticated;
grant select, insert, update, delete on public.loot_tables to authenticated;
grant select, insert, update, delete on public.loot_table_items to authenticated;
grant select, insert, update, delete on public.level_configurations to authenticated;

revoke all on function public.open_check_in_reward(uuid) from public;
revoke all on function public.get_check_in_reward(uuid) from public;
revoke all on function public.get_user_inventory() from public;
grant execute on function public.open_check_in_reward(uuid) to authenticated;
grant execute on function public.get_check_in_reward(uuid) to authenticated;
grant execute on function public.get_user_inventory() to authenticated;

drop policy if exists "items_select_active_or_admin" on public.items;
create policy "items_select_active_or_admin"
on public.items for select
to authenticated
using (status = 'ACTIVE' or public.is_admin());

drop policy if exists "reward_transactions_select_own_or_admin" on public.reward_transactions;
create policy "reward_transactions_select_own_or_admin"
on public.reward_transactions for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_inventory_select_own_or_admin" on public.user_inventory;
create policy "user_inventory_select_own_or_admin"
on public.user_inventory for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "xp_transactions_select_own_or_admin" on public.xp_transactions;
create policy "xp_transactions_select_own_or_admin"
on public.xp_transactions for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "level_configurations_select_active_or_admin" on public.level_configurations;
create policy "level_configurations_select_active_or_admin"
on public.level_configurations for select
to authenticated
using (status = 'ACTIVE' or public.is_admin());

drop policy if exists "items_admin_all" on public.items;
create policy "items_admin_all"
on public.items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "loot_tables_admin_all" on public.loot_tables;
create policy "loot_tables_admin_all"
on public.loot_tables for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "loot_table_items_admin_all" on public.loot_table_items;
create policy "loot_table_items_admin_all"
on public.loot_table_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "level_configurations_admin_all" on public.level_configurations;
create policy "level_configurations_admin_all"
on public.level_configurations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists items_category_rarity_idx on public.items (category_id, rarity);
create index if not exists reward_transactions_user_created_at_idx on public.reward_transactions (user_id, created_at desc);
create index if not exists user_inventory_user_item_idx on public.user_inventory (user_id, item_id);
create index if not exists xp_transactions_user_created_at_idx on public.xp_transactions (user_id, created_at desc);
