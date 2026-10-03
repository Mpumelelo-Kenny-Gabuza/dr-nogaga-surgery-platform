-- ============================================================================
-- Driven by the practice's confirmed booking requirements (email, 2 Oct
-- 2026): location selection, Thursday-only first consultations capped at
-- 5/day, and a separate Monday 12:00 review/follow-up flow.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- practice_locations — replaces the idea of a fixed enum. East London
-- ("KuGompo") and Mthatha have different phone/WhatsApp numbers each, and
-- Virtual isn't a physical address at all, so this needs to be real rows
-- with real contact details, not three hardcoded labels.
-- ----------------------------------------------------------------------------
create table public.practice_locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  is_physical boolean not null default true, -- false for "Virtual Consultation"
  address text,
  landline text,
  whatsapp text,
  display_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_practice_locations_updated_at
  before update on public.practice_locations
  for each row execute function public.set_updated_at();

alter table public.practice_locations enable row level security;

create policy "published locations are publicly readable"
  on public.practice_locations for select
  using (published or public.is_staff());

create policy "staff manage practice locations"
  on public.practice_locations for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- enquiries: add location + appointment type, enforce the booking rules
-- ----------------------------------------------------------------------------
create type public.appointment_type as enum ('NEW_CONSULTATION', 'REVIEW_FOLLOWUP');

-- 'CANCELLED' on enquiry_status (so a cancelled slot frees its place in the
-- Thursday cap) was added in migration 20261002105900, its own file/
-- transaction — see that file's comment for why it couldn't go here.

alter table public.enquiries
  add column practice_location_id uuid references public.practice_locations (id),
  add column appointment_type public.appointment_type not null default 'NEW_CONSULTATION';

-- Enforce "first consultations are Thursdays only" and "reviews are
-- Mondays only" at the data layer — not just a date-picker restriction in
-- the UI, which a bug or a direct API call could bypass.
create or replace function public.check_appointment_day()
returns trigger
language plpgsql
as $$
begin
  if new.preferred_date is null then
    return new;
  end if;

  if new.appointment_type = 'NEW_CONSULTATION' and extract(dow from new.preferred_date) <> 4 then
    raise exception 'First consultations are only available on Thursdays.';
  end if;

  if new.appointment_type = 'REVIEW_FOLLOWUP' and extract(dow from new.preferred_date) <> 1 then
    raise exception 'Reviews and follow-ups are only available on Mondays.';
  end if;

  return new;
end;
$$;

create trigger enquiries_check_appointment_day
  before insert or update on public.enquiries
  for each row execute function public.check_appointment_day();

-- Enforce "max 5 new-patient consultations per Thursday". A CHECK
-- constraint can't see other rows, so this has to be a trigger. Cancelled
-- bookings don't count against the cap.
create or replace function public.check_thursday_capacity()
returns trigger
language plpgsql
as $$
declare
  booked_count integer;
begin
  if new.appointment_type <> 'NEW_CONSULTATION' or new.preferred_date is null then
    return new;
  end if;

  select count(*) into booked_count
  from public.enquiries
  where preferred_date = new.preferred_date
    and appointment_type = 'NEW_CONSULTATION'
    and status <> 'CANCELLED'
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if booked_count >= 5 then
    raise exception 'That Thursday is fully booked (5 of 5 consultations). Please choose another date.';
  end if;

  return new;
end;
$$;

create trigger enquiries_check_thursday_capacity
  before insert or update on public.enquiries
  for each row execute function public.check_thursday_capacity();

-- ----------------------------------------------------------------------------
-- Public availability check — the booking form needs to know which
-- Thursdays are full *before* submitting, without being able to read
-- enquiries directly (that table stays staff-only — see Phase 2's RLS).
-- SECURITY DEFINER lets this one narrow, aggregate-only query bypass RLS
-- safely: it returns counts, never names, contact details, or messages.
-- ----------------------------------------------------------------------------
create or replace function public.get_thursday_availability(from_date date, to_date date)
returns table (slot_date date, booked_count bigint, is_available boolean)
language sql
stable
security definer set search_path = public
as $$
  select
    d::date as slot_date,
    coalesce(e.booked_count, 0) as booked_count,
    coalesce(e.booked_count, 0) < 5 as is_available
  from generate_series(from_date, to_date, '1 day'::interval) as d
  left join (
    select preferred_date, count(*) as booked_count
    from public.enquiries
    where appointment_type = 'NEW_CONSULTATION' and status <> 'CANCELLED'
    group by preferred_date
  ) e on e.preferred_date = d::date
  where extract(dow from d) = 4; -- Thursdays only
$$;

grant execute on function public.get_thursday_availability(date, date) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- team_members — "Meet Our Team" (not in the original spec; added per the
-- practice's request). Profiles pending — table supports it once they
-- arrive; publishing nothing yet is a valid, honest state.
-- ----------------------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role_title text,
  bio text,
  photo_url text,
  display_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_team_members_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

alter table public.team_members enable row level security;

create policy "published team members are publicly readable"
  on public.team_members for select
  using (published or public.is_staff());

create policy "staff manage team members"
  on public.team_members for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- site_settings: consultation fees. Phone/WhatsApp stay on the table but
-- are superseded by practice_locations for anything location-specific —
-- contact_email remains the one practice-wide inbox.
-- ----------------------------------------------------------------------------
alter table public.site_settings
  add column consultation_fee_medical_aid numeric(10, 2),
  add column consultation_fee_cash numeric(10, 2);

comment on column public.site_settings.contact_phone is
  'General fallback only — East London and Mthatha have their own numbers in practice_locations.';
comment on column public.site_settings.contact_whatsapp is
  'General fallback only — East London and Mthatha have their own numbers in practice_locations.';

-- ----------------------------------------------------------------------------
-- homepage_content: a small name line above the main headline ("Dr Viwe
-- Nogaga displayed above" — practice email, landing page section)
-- ----------------------------------------------------------------------------
alter table public.homepage_content
  add column hero_kicker text;
