create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 50),
  avatar_key text not null default 'default' check (char_length(avatar_key) between 1 and 50),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  museum_visibility text not null default 'PRIVATE' check (museum_visibility in ('PRIVATE', 'PUBLIC')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('PLAYER', 'ADMIN')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'ADMIN'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_key, status, museum_visibility)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1), 'New member'),
    'default',
    'ACTIVE',
    'PRIVATE'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'PLAYER')
  on conflict (user_id, role) do nothing;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (new.id, 'auth.user_created', 'profile', new.id, jsonb_build_object('source', 'trigger'));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on public.profiles from anon, authenticated;
revoke all on public.user_roles from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, avatar_key, museum_visibility) on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.audit_logs to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin"
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
on public.audit_logs for select
to authenticated
using (public.is_admin());

create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists user_roles_user_id_idx on public.user_roles (user_id);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs (actor_user_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
