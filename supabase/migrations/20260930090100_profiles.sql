-- ============================================================================
-- profiles — one row per staff member, 1:1 with auth.users
-- ============================================================================
-- Public patients never get a profiles row unless they also happen to sign
-- in (e.g. to like a post) — see post_likes in the blog migration, which
-- supports anonymous likes precisely so patients don't need an account.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'EDITOR',
  avatar_url text,
  -- "Deactivate user" (spec §26) is a soft-disable, not a delete — an ADMIN
  -- flips this off rather than removing the account/auth history.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Staff accounts only. First ADMIN must be promoted manually — see README §Admin setup.';

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
-- New accounts default to EDITOR; an existing ADMIN promotes them from the
-- admin Users screen (Phase 5) — never self-service (spec §26).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used throughout RLS policies (migration 20260930090800).
-- SECURITY DEFINER + fixed search_path so it can read profiles regardless of
-- the calling role, without being hijackable via a hostile search_path.
-- Returns null (not just "no role") for a deactivated account, so every
-- `current_user_role() = 'ADMIN'`-style policy check fails closed for them.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active;
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active);
$$;
