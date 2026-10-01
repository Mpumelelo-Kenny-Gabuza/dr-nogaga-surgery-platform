create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  alt_text text,
  -- Free-text rather than a lookup table — spec §14 gives example categories
  -- (Practice, Procedures, Reconstructive, Educational, General) but, unlike
  -- procedures, doesn't call these "configurable". Revisit as a real table
  -- if the practice needs to manage the category list itself.
  category text,
  display_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gallery_items_published_idx on public.gallery_items (published);

create trigger set_gallery_items_updated_at
  before update on public.gallery_items
  for each row execute function public.set_updated_at();

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  testimonial_text text not null,
  image_url text,
  procedure_id uuid references public.procedures (id) on delete set null,

  status public.content_status not null default 'DRAFT',
  is_featured boolean not null default false,
  display_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index testimonials_status_idx on public.testimonials (status);

create trigger set_testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  display_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index faqs_published_idx on public.faqs (published);

create trigger set_faqs_updated_at
  before update on public.faqs
  for each row execute function public.set_updated_at();

-- Many-to-many: which FAQs appear on a given procedure page (spec §7,
-- "FAQ associations").
create table public.procedure_faqs (
  procedure_id uuid not null references public.procedures (id) on delete cascade,
  faq_id uuid not null references public.faqs (id) on delete cascade,
  display_order integer not null default 0,
  primary key (procedure_id, faq_id)
);
