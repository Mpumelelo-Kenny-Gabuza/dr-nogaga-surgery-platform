-- Registry of everything uploaded to Supabase Storage, independent of which
-- content record (if any) currently references it — makes a "Media Library"
-- admin view possible without scanning every content table.
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  url text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),

  unique (bucket, path)
);

create index media_assets_bucket_idx on public.media_assets (bucket);

-- Append-only. Who did what, to which record, when (spec §27). Deliberately
-- minimal for now — Phase 5/6 will decide, per action, whether logging
-- happens via an app-level insert after each mutation or a DB trigger;
-- both write to this same table either way.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
