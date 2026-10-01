-- ============================================================================
-- Development seed data (spec §38)
-- ============================================================================
-- Everything below is fictional/placeholder, reusing the copy already
-- approved in the interactive demo where it exists. It is intentionally
-- left DRAFT / unpublished — flip individual rows to PUBLISHED (or run the
-- UPDATE at the bottom of this file) once you want to preview the public
-- pages end-to-end in Phase 4. Nothing here should be mistaken for a real
-- claim about Dr Nogaga's practice, qualifications or outcomes — see §48.

update public.homepage_content set
  hero_title = 'Restoring quality of life. Restoring confidence. [Demo]',
  hero_text = 'Specialist surgical care focused on restoration, function, confidence and patient-centred outcomes. [Placeholder — confirm wording with the practice.]',
  hero_cta_primary_label = 'Book a Consultation',
  hero_cta_primary_url = '/consultation',
  hero_cta_secondary_label = 'Meet Dr Nogaga',
  hero_cta_secondary_url = '/about',
  intro_heading = 'Specialist care with purpose.',
  intro_text = 'A professional profile will introduce Dr Nogaga, his qualifications, experience, affiliations and approach to patient care. [Placeholder until the practice confirms final content.]',
  reconstructive_heading = 'Restoring more than appearance.',
  reconstructive_text = 'Reconstructive surgery can help restore function, confidence and quality of life. [Placeholder — confirm scope of services with the practice before publishing.]',
  patient_journey = '[
    {"title": "Enquire", "text": "Website, phone or WhatsApp."},
    {"title": "Consultation", "text": "Assessment of needs, goals and history."},
    {"title": "Treatment Plan", "text": "Options, risks and recovery discussed."},
    {"title": "Procedure", "text": "Surgery at an appropriate facility."},
    {"title": "Follow-up", "text": "Post-operative guidance and care."}
  ]'::jsonb,
  consultation_cta_heading = 'Take the next step with the practice.',
  consultation_cta_text = 'Submit an enquiry and the practice will be in touch.'
where id = true;

update public.about_content set
  full_name = 'Dr Viwe Nogaga',
  professional_title = 'Plastic & Reconstructive Surgeon [to be confirmed]',
  approach_to_patient_care = 'Placeholder — to be provided by the practice.'
where id = true;

-- ----------------------------------------------------------------------------
-- Procedures
-- ----------------------------------------------------------------------------
with cats as (
  insert into public.procedure_categories (name, slug, display_order) values
    ('Reconstructive Surgery', 'reconstructive-surgery', 1),
    ('Breast Surgery', 'breast-surgery', 2),
    ('Aesthetic Surgery', 'aesthetic-surgery', 3)
  returning id, slug
)
insert into public.procedures (category_id, title, slug, short_description, status, is_featured, display_order)
select
  cats.id,
  v.title,
  v.slug,
  v.short_description,
  'DRAFT',
  v.is_featured,
  v.display_order
from (values
  ('reconstructive-surgery', 'Breast Reconstruction', 'breast-reconstruction',
   '[Demo] Placeholder overview of breast reconstruction. Replace with confirmed practice content before publishing.', true, 1),
  ('breast-surgery', 'Breast Reduction', 'breast-reduction',
   '[Demo] Placeholder overview of breast reduction. Replace with confirmed practice content before publishing.', true, 1),
  ('reconstructive-surgery', 'Post-Trauma Reconstruction', 'post-trauma-reconstruction',
   '[Demo] Placeholder overview of post-trauma reconstruction. Replace with confirmed practice content before publishing.', false, 2)
) as v(cat_slug, title, slug, short_description, is_featured, display_order)
join cats on cats.slug = v.cat_slug;

-- ----------------------------------------------------------------------------
-- Blog / Patient Resources
-- ----------------------------------------------------------------------------
insert into public.post_categories (name, slug, display_order) values
  ('Patient Guides', 'patient-guides', 1),
  ('Reconstructive Surgery', 'reconstructive-surgery', 2),
  ('Breast Surgery', 'breast-surgery', 3),
  ('Recovery', 'recovery', 4),
  ('General Education', 'general-education', 5);

insert into public.posts (category_id, title, slug, excerpt, status, is_featured)
select
  (select id from public.post_categories where slug = v.cat_slug),
  v.title, v.slug, v.excerpt, 'DRAFT', v.is_featured
from (values
  ('patient-guides', 'What should I expect during my first consultation?', 'first-consultation-what-to-expect',
   '[Demo] A practical introduction to the consultation process.', true),
  ('breast-surgery', 'What is breast reduction surgery?', 'what-is-breast-reduction-surgery',
   '[Demo] An educational overview for prospective patients.', false),
  ('reconstructive-surgery', 'What is reconstructive plastic surgery?', 'what-is-reconstructive-plastic-surgery',
   '[Demo] Understanding restoration, function and quality of life.', false)
) as v(cat_slug, title, slug, excerpt, is_featured);

-- ----------------------------------------------------------------------------
-- FAQs (+ linking two to the featured procedure, exercising procedure_faqs)
-- ----------------------------------------------------------------------------
with new_faqs as (
  insert into public.faqs (question, answer, display_order, published) values
    ('How do I prepare for my consultation?',
     'The consultation provides an opportunity to discuss your needs, goals and medical history.', 1, false),
    ('What happens during a consultation?',
     'The surgeon assesses your concerns and discusses appropriate options, risks and expected recovery.', 2, false)
  returning id, question
)
insert into public.procedure_faqs (procedure_id, faq_id, display_order)
select (select id from public.procedures where slug = 'breast-reconstruction'), new_faqs.id, row_number() over ()
from new_faqs;

-- ----------------------------------------------------------------------------
-- Testimonials — using the spec's own placeholder wording verbatim (§38)
-- ----------------------------------------------------------------------------
insert into public.testimonials (display_name, testimonial_text, status, is_featured)
values ('Demo Patient', 'Demo testimonial — replace with approved patient feedback.', 'DRAFT', true);

-- Gallery is intentionally left empty here — there's no real image to seed
-- honestly yet. Add placeholder images through the Phase 5 admin upload
-- flow once storage is wired up, rather than seeding a broken URL.

-- To preview the public site fully populated during Phase 4 development,
-- uncomment and run:
-- update public.procedures set status = 'PUBLISHED';
-- update public.posts set status = 'PUBLISHED';
-- update public.testimonials set status = 'PUBLISHED';
-- update public.faqs set published = true;
