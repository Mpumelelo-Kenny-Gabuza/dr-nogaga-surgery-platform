-- ============================================================================
-- Storage buckets (spec §21)
-- ============================================================================
-- All four are public-read. That's intentional and safe: this application
-- never stores real patient documents or medical records (spec §37) — these
-- buckets only ever hold marketing/content images that are meant to be
-- visible on the public website anyway. If that ever changes, a genuinely
-- private bucket needs its own migration, not a tweak to these policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets',   'public-assets',   true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('blog-images',      'blog-images',     true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('gallery-images',   'gallery-images',  true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('profile-images',   'profile-images',  true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public read across the four content buckets"
  on storage.objects for select
  using (bucket_id in ('public-assets', 'blog-images', 'gallery-images', 'profile-images'));

create policy "staff upload to the four content buckets"
  on storage.objects for insert
  with check (
    bucket_id in ('public-assets', 'blog-images', 'gallery-images', 'profile-images')
    and public.is_staff()
  );

create policy "staff replace files in the four content buckets"
  on storage.objects for update
  using (
    bucket_id in ('public-assets', 'blog-images', 'gallery-images', 'profile-images')
    and public.is_staff()
  );

create policy "staff delete files in the four content buckets"
  on storage.objects for delete
  using (
    bucket_id in ('public-assets', 'blog-images', 'gallery-images', 'profile-images')
    and public.is_staff()
  );
