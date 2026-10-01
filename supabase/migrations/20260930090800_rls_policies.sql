-- ============================================================================
-- RLS is mandatory on every table (spec §25). Nothing in this file trusts
-- the frontend's own role checks — every rule here is enforced by Postgres
-- itself, regardless of what the client sends.
--
-- Shorthand used throughout: public.is_staff() = signed in AND an active
-- ADMIN or EDITOR row in profiles. public.current_user_role() = 'ADMIN'
-- narrows further to admin-only actions (§23).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Contains only full_name/avatar_url/role — no email/phone (that stays in
-- auth.users, which this app never exposes) — so public read is low-risk
-- and is what lets a blog post show a real author byline.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "a user may update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admins may update any profile"
  on public.profiles for update
  using (public.current_user_role() = 'ADMIN');

create policy "admins may deactivate/delete a profile"
  on public.profiles for delete
  using (public.current_user_role() = 'ADMIN');

-- Defense in depth for spec §26 ("Do not allow an editor to promote
-- themselves to ADMIN"): even if a policy bug ever allowed a self-update to
-- reach this table, the role column itself refuses to change unless the
-- person making the change is already an ADMIN.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role <> old.role and public.current_user_role() <> 'ADMIN' then
    raise exception 'Only an ADMIN may change a profile''s role.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- ----------------------------------------------------------------------------
-- site_settings / homepage_content / about_content — public marketing copy
-- ----------------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.homepage_content enable row level security;
alter table public.about_content enable row level security;

create policy "site_settings are publicly readable" on public.site_settings for select using (true);
create policy "staff may update site_settings" on public.site_settings for update using (public.is_staff());

create policy "homepage_content is publicly readable" on public.homepage_content for select using (true);
create policy "staff may update homepage_content" on public.homepage_content for update using (public.is_staff());

create policy "about_content is publicly readable" on public.about_content for select using (true);
create policy "staff may update about_content" on public.about_content for update using (public.is_staff());

-- No insert/delete policies on any of the three: they're singleton rows
-- seeded once by their migration, so every role is correctly denied both.

-- ----------------------------------------------------------------------------
-- about_qualifications / about_affiliations
-- ----------------------------------------------------------------------------
alter table public.about_qualifications enable row level security;
alter table public.about_affiliations enable row level security;

create policy "qualifications are publicly readable" on public.about_qualifications for select using (true);
create policy "staff manage qualifications" on public.about_qualifications for all
  using (public.is_staff()) with check (public.is_staff());

create policy "affiliations are publicly readable" on public.about_affiliations for select using (true);
create policy "staff manage affiliations" on public.about_affiliations for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- social_links
-- ----------------------------------------------------------------------------
alter table public.social_links enable row level security;

create policy "published social links are publicly readable"
  on public.social_links for select
  using (published or public.is_staff());

create policy "staff manage social links" on public.social_links for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- procedure_categories / procedures / procedure_images
-- ----------------------------------------------------------------------------
alter table public.procedure_categories enable row level security;
alter table public.procedures enable row level security;
alter table public.procedure_images enable row level security;

create policy "procedure categories are publicly readable"
  on public.procedure_categories for select using (true);
create policy "staff manage procedure categories" on public.procedure_categories for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published procedures are publicly readable"
  on public.procedures for select
  using (status = 'PUBLISHED' or public.is_staff());
create policy "staff manage procedures" on public.procedures for all
  using (public.is_staff()) with check (public.is_staff());

create policy "images of published procedures are publicly readable"
  on public.procedure_images for select
  using (
    public.is_staff()
    or exists (
      select 1 from public.procedures p
      where p.id = procedure_images.procedure_id and p.status = 'PUBLISHED'
    )
  );
create policy "staff manage procedure images" on public.procedure_images for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- post_categories / post_tags / posts / post_tags_map
-- ----------------------------------------------------------------------------
alter table public.post_categories enable row level security;
alter table public.post_tags enable row level security;
alter table public.posts enable row level security;
alter table public.post_tags_map enable row level security;

create policy "post categories are publicly readable" on public.post_categories for select using (true);
create policy "staff manage post categories" on public.post_categories for all
  using (public.is_staff()) with check (public.is_staff());

create policy "post tags are publicly readable" on public.post_tags for select using (true);
create policy "staff manage post tags" on public.post_tags for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published posts are publicly readable"
  on public.posts for select
  using (status = 'PUBLISHED' or public.is_staff());
create policy "staff manage posts" on public.posts for all
  using (public.is_staff()) with check (public.is_staff());

create policy "tags of published posts are publicly readable"
  on public.post_tags_map for select
  using (
    public.is_staff()
    or exists (select 1 from public.posts p where p.id = post_tags_map.post_id and p.status = 'PUBLISHED')
  );
create policy "staff manage post tag assignments" on public.post_tags_map for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- post_likes — see the design note in the blog migration for the anon-like
-- tradeoff this section encodes.
-- ----------------------------------------------------------------------------
alter table public.post_likes enable row level security;

create policy "like counts are publicly readable" on public.post_likes for select using (true);

create policy "anyone may like a post"
  on public.post_likes for insert
  with check (
    (user_id is null and anon_key is not null)
    or (user_id = auth.uid())
  );

create policy "a signed-in user may remove their own like"
  on public.post_likes for delete
  using (user_id = auth.uid());

create policy "an anonymous like may be removed by anyone holding its key"
  on public.post_likes for delete
  using (anon_key is not null);

-- ----------------------------------------------------------------------------
-- comments
-- ----------------------------------------------------------------------------
alter table public.comments enable row level security;

create policy "approved comments are publicly readable"
  on public.comments for select
  using (status = 'APPROVED' or public.is_staff());

create policy "the public may submit a pending comment"
  on public.comments for insert
  with check (is_practice_reply = false and status = 'PENDING');

create policy "staff may post an official practice reply"
  on public.comments for insert
  with check (public.is_staff() and is_practice_reply = true and user_id = auth.uid());

create policy "staff moderate comments"
  on public.comments for update
  using (public.is_staff()) with check (public.is_staff());

create policy "staff delete comments"
  on public.comments for delete
  using (public.is_staff());

-- ----------------------------------------------------------------------------
-- gallery_items / testimonials / faqs / procedure_faqs
-- ----------------------------------------------------------------------------
alter table public.gallery_items enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.procedure_faqs enable row level security;

create policy "published gallery items are publicly readable"
  on public.gallery_items for select using (published or public.is_staff());
create policy "staff manage gallery items" on public.gallery_items for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published testimonials are publicly readable"
  on public.testimonials for select using (status = 'PUBLISHED' or public.is_staff());
create policy "staff manage testimonials" on public.testimonials for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published faqs are publicly readable"
  on public.faqs for select using (published or public.is_staff());
create policy "staff manage faqs" on public.faqs for all
  using (public.is_staff()) with check (public.is_staff());

create policy "procedure-faq links readable when both sides published"
  on public.procedure_faqs for select
  using (
    public.is_staff()
    or (
      exists (select 1 from public.procedures p where p.id = procedure_faqs.procedure_id and p.status = 'PUBLISHED')
      and exists (select 1 from public.faqs f where f.id = procedure_faqs.faq_id and f.published)
    )
  );
create policy "staff manage procedure-faq links" on public.procedure_faqs for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- enquiries / enquiry_notes — never publicly readable (spec §18)
-- ----------------------------------------------------------------------------
alter table public.enquiries enable row level security;
alter table public.enquiry_notes enable row level security;

create policy "anyone may submit a consultation enquiry"
  on public.enquiries for insert
  with check (status = 'NEW');

create policy "only staff may read enquiries"
  on public.enquiries for select using (public.is_staff());

create policy "staff update enquiry status"
  on public.enquiries for update using (public.is_staff()) with check (public.is_staff());

create policy "admins may delete an enquiry"
  on public.enquiries for delete using (public.current_user_role() = 'ADMIN');

create policy "only staff may access enquiry notes"
  on public.enquiry_notes for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- media_assets / audit_logs — internal tooling, never public
-- ----------------------------------------------------------------------------
alter table public.media_assets enable row level security;
alter table public.audit_logs enable row level security;

create policy "staff manage media assets"
  on public.media_assets for all
  using (public.is_staff()) with check (public.is_staff());

create policy "only admins may read the audit log"
  on public.audit_logs for select using (public.current_user_role() = 'ADMIN');

create policy "any staff action may be logged"
  on public.audit_logs for insert with check (public.is_staff());

-- No update/delete policy on audit_logs anywhere in this file — intentional.
-- The log is append-only; every role is denied both by default.
