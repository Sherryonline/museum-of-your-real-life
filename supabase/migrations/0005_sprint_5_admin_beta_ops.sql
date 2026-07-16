create extension if not exists btree_gist;

alter table public.loot_tables drop constraint if exists loot_tables_status_check;
alter table public.loot_tables
  add constraint loot_tables_status_check
  check (status in ('DRAFT', 'ACTIVE', 'INACTIVE'));

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  category varchar(40) not null check (category in ('BUG', 'IDEA', 'CONFUSING', 'PRAISE', 'OTHER')),
  message text not null check (char_length(message) between 5 and 2000),
  screenshot_url text,
  status varchar(20) not null default 'OPEN' check (status in ('OPEN', 'REVIEWED', 'RESOLVED', 'CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.beta_feedback enable row level security;

drop trigger if exists beta_feedback_set_updated_at on public.beta_feedback;
create trigger beta_feedback_set_updated_at
before update on public.beta_feedback
for each row execute function public.set_updated_at();

create or replace function public.record_admin_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  audit_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into audit_id;

  return audit_id;
end;
$$;

create or replace function public.audit_admin_table_mutation()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  entity_id uuid;
  safe_before jsonb;
  safe_after jsonb;
  new_json jsonb := '{}'::jsonb;
  old_json jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    new_json := to_jsonb(new);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    old_json := to_jsonb(old);
  end if;

  entity_id := coalesce(
    nullif(coalesce(new_json->>'id', old_json->>'id'), '')::uuid,
    nullif(coalesce(new_json->>'collection_id', old_json->>'collection_id'), '')::uuid,
    nullif(coalesce(new_json->>'loot_table_id', old_json->>'loot_table_id'), '')::uuid
  );
  safe_before := case when tg_op in ('UPDATE', 'DELETE') then old_json else null end;
  safe_after := case when tg_op in ('INSERT', 'UPDATE') then new_json else null end;

  if tg_table_name = 'check_ins' then
    safe_before := safe_before - 'user_latitude' - 'user_longitude' - 'idempotency_key';
    safe_after := safe_after - 'user_latitude' - 'user_longitude' - 'idempotency_key';
  end if;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    lower(tg_table_name) || '.' || lower(tg_op),
    tg_table_name,
    entity_id,
    jsonb_build_object('before', safe_before, 'after', safe_after, 'source', 'db_trigger')
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists location_categories_admin_audit on public.location_categories;
create trigger location_categories_admin_audit
after insert or update or delete on public.location_categories
for each row execute function public.audit_admin_table_mutation();

drop trigger if exists locations_admin_audit on public.locations;
create trigger locations_admin_audit
after insert or update or delete on public.locations
for each row execute function public.audit_admin_table_mutation();

drop trigger if exists items_admin_audit on public.items;
create trigger items_admin_audit
after insert or update or delete on public.items
for each row execute function public.audit_admin_table_mutation();

drop trigger if exists loot_tables_admin_audit on public.loot_tables;
create trigger loot_tables_admin_audit
after insert or update or delete on public.loot_tables
for each row execute function public.audit_admin_table_mutation();

drop trigger if exists loot_table_items_admin_audit on public.loot_table_items;
create trigger loot_table_items_admin_audit
after insert or update or delete on public.loot_table_items
for each row execute function public.audit_admin_table_mutation();

drop trigger if exists badges_admin_audit on public.badges;
create trigger badges_admin_audit
after insert or update or delete on public.badges
for each row execute function public.audit_admin_table_mutation();

drop trigger if exists collections_admin_audit on public.collections;
create trigger collections_admin_audit
after insert or update or delete on public.collections
for each row execute function public.audit_admin_table_mutation();

drop trigger if exists collection_items_admin_audit on public.collection_items;
create trigger collection_items_admin_audit
after insert or update or delete on public.collection_items
for each row execute function public.audit_admin_table_mutation();

drop trigger if exists app_configurations_admin_audit on public.app_configurations;
create trigger app_configurations_admin_audit
after insert or update or delete on public.app_configurations
for each row execute function public.audit_admin_table_mutation();

drop trigger if exists check_ins_admin_audit on public.check_ins;
create trigger check_ins_admin_audit
after update on public.check_ins
for each row execute function public.audit_admin_table_mutation();

drop trigger if exists beta_feedback_admin_audit on public.beta_feedback;
create trigger beta_feedback_admin_audit
after update on public.beta_feedback
for each row execute function public.audit_admin_table_mutation();

create or replace function public.validate_allowed_app_configuration()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  numeric_value numeric;
begin
  if new.config_key not in (
    'NEARBY_RADIUS_M',
    'DEFAULT_CHECKIN_RADIUS_M',
    'MAX_GPS_ACCURACY_M',
    'SAME_LOCATION_COOLDOWN_MINUTES',
    'DAILY_REWARDED_CHECKIN_LIMIT',
    'DAILY_HARD_CHECKIN_LIMIT',
    'SUSPICIOUS_TRAVEL_SPEED_KMH',
    'DUPLICATE_ITEM_XP'
  ) then
    raise exception 'CONFIGURATION_KEY_NOT_ALLOWED';
  end if;

  if jsonb_typeof(new.config_value) <> 'object' or not (new.config_value ? 'value') then
    raise exception 'CONFIGURATION_VALUE_INVALID';
  end if;

  numeric_value := (new.config_value->>'value')::numeric;

  if new.config_key in ('NEARBY_RADIUS_M', 'DEFAULT_CHECKIN_RADIUS_M', 'MAX_GPS_ACCURACY_M')
    and (numeric_value < 1 or numeric_value > 100000) then
    raise exception 'CONFIGURATION_VALUE_OUT_OF_RANGE';
  end if;

  if new.config_key in ('SAME_LOCATION_COOLDOWN_MINUTES', 'DAILY_REWARDED_CHECKIN_LIMIT', 'DAILY_HARD_CHECKIN_LIMIT', 'DUPLICATE_ITEM_XP')
    and (numeric_value < 0 or numeric_value > 10000 or numeric_value <> floor(numeric_value)) then
    raise exception 'CONFIGURATION_VALUE_OUT_OF_RANGE';
  end if;

  if new.config_key = 'SUSPICIOUS_TRAVEL_SPEED_KMH'
    and (numeric_value < 1 or numeric_value > 1200) then
    raise exception 'CONFIGURATION_VALUE_OUT_OF_RANGE';
  end if;

  return new;
exception
  when invalid_text_representation then
    raise exception 'CONFIGURATION_VALUE_INVALID';
end;
$$;

drop trigger if exists app_configurations_validate_allowed on public.app_configurations;
create trigger app_configurations_validate_allowed
before insert or update on public.app_configurations
for each row execute function public.validate_allowed_app_configuration();

create or replace function public.prevent_loot_table_overlap()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'ACTIVE' and exists (
    select 1
    from public.loot_tables lt
    where lt.category_id = new.category_id
      and lt.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and lt.status = 'ACTIVE'
      and tstzrange(lt.effective_from, lt.effective_to, '[)') && tstzrange(new.effective_from, new.effective_to, '[)')
  ) then
    raise exception 'LOOT_TABLE_EFFECTIVE_PERIOD_OVERLAP';
  end if;

  return new;
end;
$$;

drop trigger if exists loot_tables_prevent_overlap on public.loot_tables;
create trigger loot_tables_prevent_overlap
before insert or update on public.loot_tables
for each row execute function public.prevent_loot_table_overlap();

create or replace function public.prevent_protected_delete()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_table_name = 'locations' and exists (select 1 from public.check_ins where location_id = old.id) then
    raise exception 'LOCATION_HAS_CHECK_INS';
  end if;

  if tg_table_name = 'items' and (
    exists (select 1 from public.reward_transactions where item_id = old.id)
    or exists (select 1 from public.user_inventory where item_id = old.id)
    or exists (select 1 from public.collection_items where item_id = old.id)
    or exists (select 1 from public.loot_table_items where item_id = old.id)
  ) then
    raise exception 'ITEM_IS_REFERENCED';
  end if;

  return old;
end;
$$;

drop trigger if exists locations_prevent_protected_delete on public.locations;
create trigger locations_prevent_protected_delete
before delete on public.locations
for each row execute function public.prevent_protected_delete();

drop trigger if exists items_prevent_protected_delete on public.items;
create trigger items_prevent_protected_delete
before delete on public.items
for each row execute function public.prevent_protected_delete();

revoke all on public.beta_feedback from anon, authenticated;
grant insert, select, update (status) on public.beta_feedback to authenticated;
grant update (validation_status, suspicious_flag, suspicious_reason, reward_status) on public.check_ins to authenticated;

revoke all on function public.record_admin_audit(text, text, uuid, jsonb) from public;
grant execute on function public.record_admin_audit(text, text, uuid, jsonb) to authenticated;

drop policy if exists "beta_feedback_insert_own" on public.beta_feedback;
create policy "beta_feedback_insert_own"
on public.beta_feedback for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "beta_feedback_select_own_or_admin" on public.beta_feedback;
create policy "beta_feedback_select_own_or_admin"
on public.beta_feedback for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "beta_feedback_admin_update_status" on public.beta_feedback;
create policy "beta_feedback_admin_update_status"
on public.beta_feedback for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "check_ins_admin_update_review" on public.check_ins;
create policy "check_ins_admin_update_review"
on public.check_ins for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists beta_feedback_user_created_at_idx on public.beta_feedback (user_id, created_at desc);
create index if not exists beta_feedback_status_created_at_idx on public.beta_feedback (status, created_at desc);
create index if not exists loot_tables_effective_period_idx on public.loot_tables using gist (category_id, tstzrange(effective_from, effective_to, '[)'));

alter table public.loot_tables drop constraint if exists loot_tables_no_active_overlap;
alter table public.loot_tables
  add constraint loot_tables_no_active_overlap
  exclude using gist (
    category_id with =,
    tstzrange(effective_from, effective_to, '[)') with &&
  )
  where (status = 'ACTIVE');
