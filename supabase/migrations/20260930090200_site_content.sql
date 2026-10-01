-- ============================================================================
-- Singleton tables (site_settings, homepage_content, about_content)
-- ============================================================================
-- `id boolean primary key default true` + `check (id)` is a standard Postgres
-- idiom for "this table may only ever hold exactly one row": the primary key
-- forces uniqueness, and the check blocks a second row with id = false.

create table public.site_settings (
  id boolean primary key default true,
  check (id),

  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  address text,
  operating_hours text,
  map_embed_url text,

  footer_copyright_text text,
  footer_disclaimer_text text,

  seo_default_title text,
  seo_default_description text,
  seo_og_image_url text,

  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (true);

create trigger set_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

create table public.homepage_content (
  id boolean primary key default true,
  check (id),

  hero_title text,
  hero_text text,
  hero_image_url text,
  hero_cta_primary_label text,
  hero_cta_primary_url text,
  hero_cta_secondary_label text,
  hero_cta_secondary_url text,

  intro_heading text,
  intro_text text,

  reconstructive_heading text,
  reconstructive_text text,

  -- Ordered array of { title, text } steps for the patient-journey section.
  patient_journey jsonb not null default '[]'::jsonb,

  consultation_cta_heading text,
  consultation_cta_text text,

  updated_at timestamptz not null default now()
);

insert into public.homepage_content (id) values (true);

create trigger set_homepage_content_updated_at
  before update on public.homepage_content
  for each row execute function public.set_updated_at();

create table public.about_content (
  id boolean primary key default true,
  check (id),

  full_name text,
  professional_title text,
  biography text,
  profile_image_url text,
  approach_to_patient_care text,

  updated_at timestamptz not null default now()
);

insert into public.about_content (id) values (true);

create trigger set_about_content_updated_at
  before update on public.about_content
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Repeatable lists attached to the About page
-- ============================================================================
create table public.about_qualifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  institution text,
  year_obtained smallint,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Covers both "professional memberships" and "affiliations" from spec §6,
-- distinguished by `kind` rather than two separate tables.
create table public.about_affiliations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'AFFILIATION' check (kind in ('AFFILIATION', 'MEMBERSHIP')),
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- social_links — repeatable, unlike the fixed contact fields above
-- ============================================================================
create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  display_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
