create table if not exists public.location_categories (
  id uuid primary key default gen_random_uuid(),
  code varchar(30) not null unique,
  name varchar(100) not null,
  icon varchar(50) not null,
  chest_name varchar(100) not null,
  status varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  code varchar(30) not null unique,
  name varchar(150) not null,
  brand_name varchar(100),
  category_id uuid not null references public.location_categories(id),
  latitude numeric(10,7) not null check (latitude between -90 and 90),
  longitude numeric(10,7) not null check (longitude between -180 and 180),
  address text not null,
  city varchar(100) not null,
  district varchar(100) not null,
  check_in_radius_m integer not null default 150 check (check_in_radius_m > 0),
  status varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  partner_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references public.locations(id),
  idempotency_key uuid not null,
  user_latitude numeric(10,7) not null check (user_latitude between -90 and 90),
  user_longitude numeric(10,7) not null check (user_longitude between -180 and 180),
  gps_accuracy_m numeric(10,2) not null check (gps_accuracy_m > 0),
  calculated_distance_m numeric(10,2) not null check (calculated_distance_m >= 0),
  client_timestamp timestamptz not null,
  server_timestamp timestamptz not null default now(),
  validation_status varchar(30) not null check (validation_status in ('VALID', 'REJECTED', 'SUSPICIOUS')),
  suspicious_flag boolean not null default false,
  suspicious_reason varchar(200),
  reward_status varchar(30) not null default 'NOT_APPLICABLE' check (reward_status in ('NOT_APPLICABLE', 'PENDING', 'BLOCKED')),
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_id uuid not null unique references public.check_ins(id) on delete cascade,
  location_id uuid not null references public.locations(id),
  category_id uuid not null references public.location_categories(id),
  title varchar(150) not null,
  note text,
  photo_url text,
  visibility varchar(20) not null default 'PRIVATE' check (visibility in ('PRIVATE', 'PUBLIC')),
  visited_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_configurations (
  id uuid primary key default gen_random_uuid(),
  config_key varchar(100) not null unique,
  config_value jsonb not null,
  description text not null,
  status varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  updated_at timestamptz not null default now()
);

alter table public.location_categories enable row level security;
alter table public.locations enable row level security;
alter table public.check_ins enable row level security;
alter table public.memories enable row level security;
alter table public.app_configurations enable row level security;

drop trigger if exists location_categories_set_updated_at on public.location_categories;
create trigger location_categories_set_updated_at
before update on public.location_categories
for each row execute function public.set_updated_at();

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

drop trigger if exists memories_set_updated_at on public.memories;
create trigger memories_set_updated_at
before update on public.memories
for each row execute function public.set_updated_at();

create or replace function public.calculate_distance_m(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
)
returns numeric
language sql
immutable
strict
as $$
  select round(
    (
      6371000 * 2 * asin(
        least(
          1,
          sqrt(
            power(sin(radians((lat2 - lat1) / 2)), 2) +
            cos(radians(lat1)) * cos(radians(lat2)) *
            power(sin(radians((lon2 - lon1) / 2)), 2)
          )
        )
      )
    )::numeric,
    2
  );
$$;

create or replace function public.get_config_number(config_name text)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select (config_value->>'value')::numeric
  from public.app_configurations
  where config_key = config_name
    and status = 'ACTIVE';
$$;

create or replace function public.get_nearby_locations(
  p_latitude numeric,
  p_longitude numeric,
  p_radius_m integer default null
)
returns table (
  location_id uuid,
  name varchar,
  brand_name varchar,
  category_code varchar,
  category_name varchar,
  category_icon varchar,
  distance_m numeric,
  check_in_radius_m integer,
  address text,
  city varchar,
  district varchar,
  eligible boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  max_radius integer;
  requested_radius integer;
begin
  if auth.uid() is null then
    raise exception 'CHECKIN_GPS_REQUIRED';
  end if;

  if p_latitude is null or p_longitude is null or p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then
    raise exception 'CHECKIN_INVALID_REQUEST';
  end if;

  max_radius := coalesce(public.get_config_number('NEARBY_RADIUS_M')::integer, 1000);
  requested_radius := least(coalesce(p_radius_m, max_radius), max_radius);

  return query
  select
    l.id,
    l.name,
    l.brand_name,
    c.code,
    c.name,
    c.icon,
    public.calculate_distance_m(p_latitude, p_longitude, l.latitude, l.longitude) as distance_m,
    l.check_in_radius_m,
    l.address,
    l.city,
    l.district,
    public.calculate_distance_m(p_latitude, p_longitude, l.latitude, l.longitude) <= l.check_in_radius_m as eligible
  from public.locations l
  join public.location_categories c on c.id = l.category_id
  where l.status = 'ACTIVE'
    and c.status = 'ACTIVE'
    and public.calculate_distance_m(p_latitude, p_longitude, l.latitude, l.longitude) <= requested_radius
  order by distance_m asc
  limit 20;
end;
$$;

create or replace function public.process_check_in(
  p_location_id uuid,
  p_latitude numeric,
  p_longitude numeric,
  p_accuracy_m numeric,
  p_client_timestamp timestamptz,
  p_idempotency_key uuid
)
returns table (
  check_in_id uuid,
  memory_id uuid,
  validation_status varchar,
  reward_status varchar,
  suspicious_flag boolean,
  error_code text,
  user_message text,
  retry_after_seconds integer
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  server_now timestamptz := now();
  location_record record;
  existing_check_in record;
  created_check_in_id uuid;
  created_memory_id uuid;
  calculated_distance numeric;
  max_accuracy numeric;
  cooldown_minutes integer;
  hard_daily_limit integer;
  suspicious_speed_kmh numeric;
  same_location_valid_at timestamptz;
  daily_count integer;
  previous_valid record;
  travel_distance_m numeric;
  elapsed_hours numeric;
  estimated_speed_kmh numeric;
  final_status varchar(30) := 'VALID';
  final_reward_status varchar(30) := 'NOT_APPLICABLE';
  final_suspicious boolean := false;
  final_reason varchar(200);
  final_error text;
  final_message text := 'Check-in accepted.';
  retry_seconds integer;
begin
  if actor_id is null then
    return query select null::uuid, null::uuid, 'REJECTED'::varchar, 'NOT_APPLICABLE'::varchar, false, 'CHECKIN_GPS_REQUIRED', 'Sign in is required before checking in.', null::integer;
    return;
  end if;

  if p_location_id is null or p_latitude is null or p_longitude is null or p_accuracy_m is null or p_client_timestamp is null or p_idempotency_key is null
    or p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 or p_accuracy_m <= 0 then
    return query select null::uuid, null::uuid, 'REJECTED'::varchar, 'NOT_APPLICABLE'::varchar, false, 'CHECKIN_INVALID_REQUEST', 'The check-in request is invalid.', null::integer;
    return;
  end if;

  select *
  into existing_check_in
  from public.check_ins
  where user_id = actor_id
    and idempotency_key = p_idempotency_key;

  if found then
    select m.id into created_memory_id from public.memories m where m.check_in_id = existing_check_in.id;
    return query select existing_check_in.id, created_memory_id, existing_check_in.validation_status, existing_check_in.reward_status, existing_check_in.suspicious_flag, 'CHECKIN_ALREADY_PROCESSED', 'This check-in request was already processed.', null::integer;
    return;
  end if;

  select l.*, c.id as joined_category_id
  into location_record
  from public.locations l
  join public.location_categories c on c.id = l.category_id
  where l.id = p_location_id;

  if not found then
    return query select null::uuid, null::uuid, 'REJECTED'::varchar, 'NOT_APPLICABLE'::varchar, false, 'CHECKIN_LOCATION_NOT_FOUND', 'The selected location is not available.', null::integer;
    return;
  end if;

  if location_record.status <> 'ACTIVE' then
    return query select null::uuid, null::uuid, 'REJECTED'::varchar, 'NOT_APPLICABLE'::varchar, false, 'CHECKIN_LOCATION_INACTIVE', 'The selected location is not active.', null::integer;
    return;
  end if;

  max_accuracy := coalesce(public.get_config_number('MAX_GPS_ACCURACY_M'), 100);
  cooldown_minutes := coalesce(public.get_config_number('SAME_LOCATION_COOLDOWN_MINUTES')::integer, 240);
  hard_daily_limit := coalesce(public.get_config_number('DAILY_HARD_CHECKIN_LIMIT')::integer, 30);
  suspicious_speed_kmh := coalesce(public.get_config_number('SUSPICIOUS_TRAVEL_SPEED_KMH'), 150);
  calculated_distance := public.calculate_distance_m(p_latitude, p_longitude, location_record.latitude, location_record.longitude);

  if p_accuracy_m > max_accuracy then
    final_status := 'REJECTED';
    final_error := 'CHECKIN_GPS_INACCURATE';
    final_message := 'GPS accuracy is too low. Move to a clearer location and retry.';
    retry_seconds := 60;
  elsif calculated_distance > location_record.check_in_radius_m then
    final_status := 'REJECTED';
    final_error := 'CHECKIN_OUT_OF_RANGE';
    final_message := 'You are not close enough to this location.';
  else
    select max(server_timestamp)
    into same_location_valid_at
    from public.check_ins
    where user_id = actor_id
      and location_id = p_location_id
      and validation_status = 'VALID'
      and server_timestamp > server_now - make_interval(mins => cooldown_minutes);

    if same_location_valid_at is not null then
      final_status := 'REJECTED';
      final_error := 'CHECKIN_COOLDOWN';
      final_message := 'This location was checked in recently. Try again later.';
      retry_seconds := greatest(0, (extract(epoch from (same_location_valid_at + make_interval(mins => cooldown_minutes) - server_now)))::integer);
    else
      select count(*)
      into daily_count
      from public.check_ins
      where user_id = actor_id
        and server_timestamp >= date_trunc('day', server_now);

      if daily_count >= hard_daily_limit then
        final_status := 'REJECTED';
        final_error := 'CHECKIN_HARD_DAILY_LIMIT';
        final_message := 'Daily check-in limit reached. Try again tomorrow.';
      else
        select ci.location_id, ci.server_timestamp, l.latitude, l.longitude
        into previous_valid
        from public.check_ins ci
        join public.locations l on l.id = ci.location_id
        where ci.user_id = actor_id
          and ci.validation_status = 'VALID'
        order by ci.server_timestamp desc
        limit 1;

        if found then
          travel_distance_m := public.calculate_distance_m(previous_valid.latitude, previous_valid.longitude, p_latitude, p_longitude);
          elapsed_hours := extract(epoch from (server_now - previous_valid.server_timestamp)) / 3600;

          if elapsed_hours > 0 then
            estimated_speed_kmh := (travel_distance_m / 1000) / elapsed_hours;
            if estimated_speed_kmh > suspicious_speed_kmh then
              final_status := 'SUSPICIOUS';
              final_reward_status := 'BLOCKED';
              final_suspicious := true;
              final_reason := 'TRAVEL_SPEED_REVIEW';
              final_error := 'CHECKIN_SUSPICIOUS_TRAVEL';
              final_message := 'Check-in recorded for review.';
            end if;
          end if;
        end if;
      end if;
    end if;
  end if;

  insert into public.check_ins (
    user_id,
    location_id,
    idempotency_key,
    user_latitude,
    user_longitude,
    gps_accuracy_m,
    calculated_distance_m,
    client_timestamp,
    server_timestamp,
    validation_status,
    suspicious_flag,
    suspicious_reason,
    reward_status
  )
  values (
    actor_id,
    p_location_id,
    p_idempotency_key,
    p_latitude,
    p_longitude,
    p_accuracy_m,
    calculated_distance,
    p_client_timestamp,
    server_now,
    final_status,
    final_suspicious,
    final_reason,
    final_reward_status
  )
  returning id into created_check_in_id;

  if final_status = 'VALID' then
    insert into public.memories (
      user_id,
      check_in_id,
      location_id,
      category_id,
      title,
      visited_at
    )
    values (
      actor_id,
      created_check_in_id,
      p_location_id,
      location_record.category_id,
      location_record.name,
      server_now
    )
    returning id into created_memory_id;
  end if;

  return query select created_check_in_id, created_memory_id, final_status, final_reward_status, final_suspicious, final_error, final_message, retry_seconds;
end;
$$;

create or replace function public.get_check_in_history()
returns table (
  check_in_id uuid,
  validation_status varchar,
  reward_status varchar,
  suspicious_flag boolean,
  server_timestamp timestamptz,
  calculated_distance_m numeric,
  location_name varchar,
  category_name varchar,
  category_icon varchar,
  memory_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ci.id,
    ci.validation_status,
    ci.reward_status,
    ci.suspicious_flag,
    ci.server_timestamp,
    ci.calculated_distance_m,
    l.name,
    c.name,
    c.icon,
    m.id
  from public.check_ins ci
  join public.locations l on l.id = ci.location_id
  join public.location_categories c on c.id = l.category_id
  left join public.memories m on m.check_in_id = ci.id
  where ci.user_id = auth.uid()
  order by ci.server_timestamp desc
  limit 50;
$$;

create or replace function public.get_check_in_detail(p_check_in_id uuid)
returns table (
  check_in_id uuid,
  validation_status varchar,
  reward_status varchar,
  suspicious_flag boolean,
  server_timestamp timestamptz,
  calculated_distance_m numeric,
  location_name varchar,
  location_address text,
  category_name varchar,
  category_icon varchar,
  memory_id uuid,
  memory_title varchar,
  memory_note text,
  memory_visibility varchar
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ci.id,
    ci.validation_status,
    ci.reward_status,
    ci.suspicious_flag,
    ci.server_timestamp,
    ci.calculated_distance_m,
    l.name,
    l.address,
    c.name,
    c.icon,
    m.id,
    m.title,
    m.note,
    m.visibility
  from public.check_ins ci
  join public.locations l on l.id = ci.location_id
  join public.location_categories c on c.id = l.category_id
  left join public.memories m on m.check_in_id = ci.id
  where ci.user_id = auth.uid()
    and ci.id = p_check_in_id;
$$;

revoke all on public.location_categories from anon, authenticated;
revoke all on public.locations from anon, authenticated;
revoke all on public.check_ins from anon, authenticated;
revoke all on public.memories from anon, authenticated;
revoke all on public.app_configurations from anon, authenticated;

grant select on public.location_categories to authenticated;
grant select on public.locations to authenticated;
grant select on public.check_ins to authenticated;
grant select on public.memories to authenticated;
grant update (note, photo_url, visibility) on public.memories to authenticated;
grant insert, update, delete on public.location_categories to authenticated;
grant insert, update, delete on public.locations to authenticated;
grant select, insert, update, delete on public.app_configurations to authenticated;

revoke all on function public.get_config_number(text) from public;
revoke all on function public.get_nearby_locations(numeric, numeric, integer) from public;
revoke all on function public.process_check_in(uuid, numeric, numeric, numeric, timestamptz, uuid) from public;
revoke all on function public.get_check_in_history() from public;
revoke all on function public.get_check_in_detail(uuid) from public;
grant execute on function public.get_nearby_locations(numeric, numeric, integer) to authenticated;
grant execute on function public.process_check_in(uuid, numeric, numeric, numeric, timestamptz, uuid) to authenticated;
grant execute on function public.get_check_in_history() to authenticated;
grant execute on function public.get_check_in_detail(uuid) to authenticated;

drop policy if exists "location_categories_select_active_or_admin" on public.location_categories;
create policy "location_categories_select_active_or_admin"
on public.location_categories for select
to authenticated
using (status = 'ACTIVE' or public.is_admin());

drop policy if exists "locations_select_active_or_admin" on public.locations;
create policy "locations_select_active_or_admin"
on public.locations for select
to authenticated
using (status = 'ACTIVE' or public.is_admin());

drop policy if exists "check_ins_select_own_or_admin" on public.check_ins;
create policy "check_ins_select_own_or_admin"
on public.check_ins for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "memories_select_own_or_admin" on public.memories;
create policy "memories_select_own_or_admin"
on public.memories for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "memories_update_own_editable" on public.memories;
create policy "memories_update_own_editable"
on public.memories for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "app_configurations_select_admin" on public.app_configurations;
create policy "app_configurations_select_admin"
on public.app_configurations for select
to authenticated
using (public.is_admin());

drop policy if exists "location_categories_admin_all" on public.location_categories;
create policy "location_categories_admin_all"
on public.location_categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "locations_admin_all" on public.locations;
create policy "locations_admin_all"
on public.locations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "app_configurations_admin_all" on public.app_configurations;
create policy "app_configurations_admin_all"
on public.app_configurations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.app_configurations (config_key, config_value, description, status)
values
  ('NEARBY_RADIUS_M', '{"value": 1000, "seed": "development"}', 'Maximum nearby search radius in meters.', 'ACTIVE'),
  ('DEFAULT_CHECKIN_RADIUS_M', '{"value": 150, "seed": "development"}', 'Default location check-in radius in meters.', 'ACTIVE'),
  ('MAX_GPS_ACCURACY_M', '{"value": 100, "seed": "development"}', 'Maximum accepted GPS accuracy in meters.', 'ACTIVE'),
  ('SAME_LOCATION_COOLDOWN_MINUTES', '{"value": 240, "seed": "development"}', 'Cooldown between valid same-location check-ins.', 'ACTIVE'),
  ('DAILY_REWARDED_CHECKIN_LIMIT', '{"value": 10, "seed": "development"}', 'Reserved reward limit; rewards are not generated in Sprint 1.', 'ACTIVE'),
  ('DAILY_HARD_CHECKIN_LIMIT', '{"value": 30, "seed": "development"}', 'Hard daily check-in attempt limit.', 'ACTIVE'),
  ('SUSPICIOUS_TRAVEL_SPEED_KMH', '{"value": 150, "seed": "development"}', 'Travel speed threshold for suspicious review.', 'ACTIVE')
on conflict (config_key) do update set
  config_value = excluded.config_value,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.location_categories (code, name, icon, chest_name, status)
values
  ('COFFEE', 'Coffee', 'coffee', 'Coffee Chest', 'ACTIVE'),
  ('FOOD', 'Food', 'utensils', 'Food Chest', 'ACTIVE'),
  ('CINEMA', 'Cinema', 'film', 'Cinema Chest', 'ACTIVE'),
  ('SHOPPING', 'Shopping', 'shopping-bag', 'Shopping Chest', 'ACTIVE'),
  ('NATURE', 'Nature', 'trees', 'Nature Chest', 'ACTIVE'),
  ('CULTURE', 'Culture', 'landmark', 'Culture Chest', 'ACTIVE'),
  ('TRAVEL', 'Travel', 'plane', 'Travel Chest', 'ACTIVE'),
  ('LIFESTYLE', 'Lifestyle', 'sparkles', 'Lifestyle Chest', 'ACTIVE')
on conflict (code) do update set
  name = excluded.name,
  icon = excluded.icon,
  chest_name = excluded.chest_name,
  status = excluded.status,
  updated_at = now();

insert into public.locations (code, name, brand_name, category_id, latitude, longitude, address, city, district, check_in_radius_m, status, partner_flag)
select seed.code, seed.name, seed.brand_name, c.id, seed.latitude, seed.longitude, seed.address, seed.city, seed.district, seed.radius, 'ACTIVE', false
from (
  values
    ('DEV_COFFEE_01', 'Development Coffee Corner', 'Dev Beans', 'COFFEE', 13.7563000, 100.5018000, 'Development seed location - coffee 1', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_COFFEE_02', 'Development Espresso Lab', 'Seed Roasters', 'COFFEE', 13.7549000, 100.5031000, 'Development seed location - coffee 2', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_COFFEE_03', 'Development Riverside Cafe', 'Mock Brew', 'COFFEE', 13.7581000, 100.4997000, 'Development seed location - coffee 3', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_FOOD_01', 'Development Noodle House', 'Seed Bowl', 'FOOD', 13.7557000, 100.5060000, 'Development seed location - food 1', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_FOOD_02', 'Development Lunch Market', null, 'FOOD', 13.7592000, 100.5046000, 'Development seed location - food 2', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_FOOD_03', 'Development Dumpling Table', 'Mock Plate', 'FOOD', 13.7529000, 100.4992000, 'Development seed location - food 3', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_CINEMA_01', 'Development Cinema One', 'Seed Screen', 'CINEMA', 13.7601000, 100.5014000, 'Development seed location - cinema 1', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_CINEMA_02', 'Development Indie Theater', null, 'CINEMA', 13.7518000, 100.5035000, 'Development seed location - cinema 2', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_CINEMA_03', 'Development Film Hall', 'Mock Pictures', 'CINEMA', 13.7572000, 100.5081000, 'Development seed location - cinema 3', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_SHOPPING_01', 'Development Market Arcade', null, 'SHOPPING', 13.7533000, 100.5052000, 'Development seed location - shopping 1', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_SHOPPING_02', 'Development Design Store', 'Seed Goods', 'SHOPPING', 13.7610000, 100.5009000, 'Development seed location - shopping 2', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_SHOPPING_03', 'Development Book Bazaar', 'Mock Pages', 'SHOPPING', 13.7551000, 100.4979000, 'Development seed location - shopping 3', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_NATURE_01', 'Development Pocket Park', null, 'NATURE', 13.7599000, 100.4975000, 'Development seed location - nature 1', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_NATURE_02', 'Development Canal Walk', null, 'NATURE', 13.7509000, 100.5008000, 'Development seed location - nature 2', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_NATURE_03', 'Development Garden Steps', null, 'NATURE', 13.7566000, 100.5093000, 'Development seed location - nature 3', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_CULTURE_01', 'Development Gallery Room', 'Seed Gallery', 'CULTURE', 13.7544000, 100.5010000, 'Development seed location - culture 1', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_CULTURE_02', 'Development Heritage Hall', null, 'CULTURE', 13.7622000, 100.5039000, 'Development seed location - culture 2', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_CULTURE_03', 'Development Archive House', 'Mock Archive', 'CULTURE', 13.7579000, 100.4968000, 'Development seed location - culture 3', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_TRAVEL_01', 'Development Ferry Pier', null, 'TRAVEL', 13.7505000, 100.4971000, 'Development seed location - travel 1', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_TRAVEL_02', 'Development Transit Gate', 'Seed Transit', 'TRAVEL', 13.7630000, 100.5017000, 'Development seed location - travel 2', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_TRAVEL_03', 'Development Waypoint Desk', null, 'TRAVEL', 13.7588000, 100.5074000, 'Development seed location - travel 3', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_LIFESTYLE_01', 'Development Studio Lobby', 'Seed Studio', 'LIFESTYLE', 13.7522000, 100.5021000, 'Development seed location - lifestyle 1', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_LIFESTYLE_02', 'Development Wellness Room', null, 'LIFESTYLE', 13.7607000, 100.5063000, 'Development seed location - lifestyle 2', 'Bangkok', 'Phra Nakhon', 150),
    ('DEV_LIFESTYLE_03', 'Development Workshop Space', 'Mock Studio', 'LIFESTYLE', 13.7560000, 100.4959000, 'Development seed location - lifestyle 3', 'Bangkok', 'Phra Nakhon', 150)
) as seed(code, name, brand_name, category_code, latitude, longitude, address, city, district, radius)
join public.location_categories c on c.code = seed.category_code
on conflict (code) do update set
  name = excluded.name,
  brand_name = excluded.brand_name,
  category_id = excluded.category_id,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  address = excluded.address,
  city = excluded.city,
  district = excluded.district,
  check_in_radius_m = excluded.check_in_radius_m,
  status = excluded.status,
  partner_flag = excluded.partner_flag,
  updated_at = now();

create index if not exists location_categories_status_idx on public.location_categories (status);
create index if not exists locations_status_idx on public.locations (status);
create index if not exists locations_category_id_idx on public.locations (category_id);
create index if not exists check_ins_user_server_timestamp_idx on public.check_ins (user_id, server_timestamp desc);
create index if not exists check_ins_user_location_timestamp_idx on public.check_ins (user_id, location_id, server_timestamp desc);
create index if not exists memories_user_created_at_idx on public.memories (user_id, created_at desc);
