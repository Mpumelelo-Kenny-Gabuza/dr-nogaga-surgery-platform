create table public.procedure_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.procedures (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.procedure_categories (id) on delete set null,

  title text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  featured_image_url text,

  patient_information text,
  preparation_information text,
  recovery_information text,
  risks_disclaimer text,

  seo_title text,
  seo_description text,

  status public.content_status not null default 'DRAFT',
  is_featured boolean not null default false,
  display_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index procedures_status_idx on public.procedures (status);
create index procedures_category_id_idx on public.procedures (category_id);

create trigger set_procedures_updated_at
  before update on public.procedures
  for each row execute function public.set_updated_at();

create table public.procedure_images (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.procedures (id) on delete cascade,
  image_url text not null,
  caption text,
  alt_text text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index procedure_images_procedure_id_idx on public.procedure_images (procedure_id);
