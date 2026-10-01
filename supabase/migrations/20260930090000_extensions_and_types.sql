-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ============================================================================
-- Enum types
-- ============================================================================

-- Staff roles. Public visitors are unauthenticated and have no role.
create type public.user_role as enum ('ADMIN', 'EDITOR');

-- Lifecycle for content with a full editorial workflow (posts, procedures,
-- testimonials). Simpler content (faqs, gallery_items) just uses a
-- `published boolean` instead of this enum — see their migrations.
create type public.content_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Consultation enquiry pipeline — matches spec §18 exactly.
create type public.enquiry_status as enum (
  'NEW',
  'CONTACTED',
  'CONSULTATION_BOOKED',
  'CLOSED'
);

create type public.preferred_contact_method as enum ('WHATSAPP', 'PHONE', 'EMAIL');

-- Comment moderation states — spec §11 (pending / approve / reject / hide).
-- "Delete" is a real row deletion, not a status.
create type public.comment_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN');

-- ============================================================================
-- Shared trigger: keep `updated_at` current on every UPDATE
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Attach as a BEFORE UPDATE trigger on any table with an updated_at column.';
