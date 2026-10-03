-- ============================================================================
-- Confirmed content from the practice (email, 2 Oct 2026). Replaces the
-- Phase 2 placeholder procedures with the real, complete service list, and
-- fills in everything else that's now confirmed. What's still pending per
-- that same email (bio, memberships, affiliations, medical aid info,
-- community/foundation details, photography, team profiles, testimonials)
-- is deliberately left alone — still "to be confirmed", not guessed at.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Practice locations
-- ----------------------------------------------------------------------------
insert into public.practice_locations (slug, display_name, is_physical, address, landline, whatsapp, display_order) values
  ('kugompo', 'KuGompo (East London)', true, '81A Frere Road, Vincent', '043 050 9103', '061 500 2193', 1),
  -- Mthatha gave one number for both calls and WhatsApp, not two separate ones.
  ('mthatha', 'Mthatha', true, 'Unit F1, 55 Nelson Mandela Drive', null, '061 519 0850', 2),
  ('virtual', 'Virtual Consultation', false, null, null, null, 3);

-- ----------------------------------------------------------------------------
-- Replace the 3 placeholder procedures with the real, complete service
-- list. procedure_faqs/procedure_images/testimonials.procedure_id all
-- reference procedures with ON DELETE CASCADE/SET NULL — see migration
-- 20260930090300/090500 — so this is safe to do outright.
-- ----------------------------------------------------------------------------
delete from public.procedures
  where slug in ('breast-reconstruction', 'breast-reduction', 'post-trauma-reconstruction');

insert into public.procedure_categories (name, slug, display_order) values
  ('Wellness & Non-Surgical', 'wellness-non-surgical', 4)
on conflict (slug) do nothing;

with cats as (
  select id, slug from public.procedure_categories
)
insert into public.procedures (category_id, title, slug, short_description, full_description, status, is_featured, display_order)
select
  cats.id, v.title, v.slug, v.short_description,
  v.short_description || ' Detailed procedure information is being finalized by the practice and will be added soon.',
  'PUBLISHED', v.is_featured, v.display_order
from (values
  -- Reconstructive Surgery
  ('reconstructive-surgery', 'Reconstruction', 'reconstruction',
   'Reconstructive surgery following trauma, illness or congenital conditions.', true, 1),
  ('reconstructive-surgery', 'Gender Reassignment', 'gender-reassignment',
   'Surgical care supporting gender affirmation.', false, 2),
  ('reconstructive-surgery', 'Keloid Removal', 'keloid-removal',
   'Treatment for raised, overgrown scar tissue.', false, 3),
  -- Breast Surgery
  ('breast-surgery', 'Breast Reduction', 'breast-reduction',
   'Reduces breast size and weight to relieve physical discomfort and improve proportion.', true, 1),
  ('breast-surgery', 'Breast Lift', 'breast-lift',
   'Raises and reshapes breasts affected by sagging, without changing size.', false, 2),
  ('breast-surgery', 'Gynecomastia', 'gynecomastia',
   'Treatment for enlarged male breast tissue.', false, 3),
  -- Aesthetic Surgery
  ('aesthetic-surgery', 'Tummy Tuck', 'tummy-tuck',
   'Removes excess abdominal skin and tightens the underlying muscle.', false, 1),
  ('aesthetic-surgery', 'Liposuction', 'liposuction',
   'Removes localized fat deposits to refine body contour.', true, 2),
  ('aesthetic-surgery', 'Face Lift', 'face-lift',
   'Repositions facial and neck tissue to address visible signs of ageing.', false, 3),
  ('aesthetic-surgery', 'Otoplasty', 'otoplasty',
   'Reshapes or repositions the ears.', false, 4),
  ('aesthetic-surgery', 'Rhinoplasty', 'rhinoplasty',
   'Reshapes the nose for aesthetic or functional reasons.', false, 5),
  ('aesthetic-surgery', 'Chin Augmentation', 'chin-augmentation',
   'Enhances chin projection and facial balance.', false, 6),
  ('aesthetic-surgery', 'Botox & Fillers', 'botox-and-fillers',
   'Non-surgical treatments to soften lines and restore volume.', false, 7),
  -- Wellness & Non-Surgical
  ('wellness-non-surgical', 'IV Drips', 'iv-drips',
   'Intravenous vitamin and hydration therapy.', false, 1),
  ('wellness-non-surgical', 'Red Light Therapy', 'red-light-therapy',
   'Light-based therapy supporting skin and recovery wellness.', false, 2)
) as v(cat_slug, title, slug, short_description, is_featured, display_order)
join cats on cats.slug = v.cat_slug;

-- ----------------------------------------------------------------------------
-- Confirmed qualifications
-- ----------------------------------------------------------------------------
insert into public.about_qualifications (title, display_order) values
  ('BSc', 1),
  ('MBChB (MEDUNSA)', 2),
  ('FC Plastic Surgery', 3);

-- ----------------------------------------------------------------------------
-- about_content / homepage_content copy
-- ----------------------------------------------------------------------------
update public.about_content set
  professional_title = 'Plastic & Reconstructive Surgeon'
where id = true;

update public.homepage_content set
  hero_kicker = 'Dr Viwe Nogaga',
  intro_heading = 'Meet Dr Viwe Nogaga'
where id = true;

-- ----------------------------------------------------------------------------
-- Consultation fees + current contact email
-- ----------------------------------------------------------------------------
update public.site_settings set
  consultation_fee_medical_aid = 1500.00,
  consultation_fee_cash = 2000.00,
  contact_email = 'drviwenogagasurgery@gmail.com'
where id = true;
