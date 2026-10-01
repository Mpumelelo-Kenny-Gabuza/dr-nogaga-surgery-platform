create sequence public.enquiry_reference_seq;

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,

  first_name text not null,
  surname text not null,
  email text,
  phone text not null,
  preferred_contact_method public.preferred_contact_method not null default 'WHATSAPP',
  area_of_enquiry text,
  preferred_date date,
  message text,

  -- POPIA consent checkbox (spec §17/§37). Required at the application
  -- layer; stored so there's a record of it having been given.
  consent boolean not null default false,

  status public.enquiry_status not null default 'NEW',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index enquiries_status_idx on public.enquiries (status);
create index enquiries_created_at_idx on public.enquiries (created_at desc);

create trigger set_enquiries_updated_at
  before update on public.enquiries
  for each row execute function public.set_updated_at();

-- Auto-generate a human-friendly reference like ENQ-2026-00001 (spec §17
-- step 3) instead of exposing the raw UUID to patients.
create or replace function public.set_enquiry_reference()
returns trigger
language plpgsql
as $$
begin
  if new.reference is null then
    new.reference := 'ENQ-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.enquiry_reference_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger set_enquiries_reference
  before insert on public.enquiries
  for each row execute function public.set_enquiry_reference();

-- Internal notes — never exposed publicly (spec §18: "Do NOT expose
-- internal notes to the public"). Enforced in RLS, migration 20260930090800.
create table public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index enquiry_notes_enquiry_id_idx on public.enquiry_notes (enquiry_id);
