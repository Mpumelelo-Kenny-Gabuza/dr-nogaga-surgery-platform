-- ============================================================================
-- Phase 4 (public website build) needs homepage_content to actually be
-- presentable — it's a singleton with no draft/published state, so unlike
-- procedures/posts/testimonials, whatever is in these columns is already
-- live the moment the frontend reads it.
--
-- Everything 20260930091000_seed_data.sql put in here was explicitly
-- tagged "[Demo]" / "[Placeholder]" and was never meant to reach a real
-- visitor (see that file's own header comment). This replaces those
-- columns with clean, structural site copy — CTA labels, the patient
-- journey steps, section headings — none of which asserts any unconfirmed
-- fact about Dr Nogaga personally (no years of experience, no outcomes,
-- no scope-of-service claims beyond what the confirmed procedure list in
-- 20261002110100_confirmed_content.sql already establishes).
--
-- Also fixes intro_text, which 20261002110100_confirmed_content.sql missed:
-- that migration updated intro_heading to the confirmed "Meet Dr Viwe
-- Nogaga" but left the seed's own "[Placeholder until the practice
-- confirms final content.]" sentence sitting underneath it in intro_text.
--
-- Deliberately NOT touched here: about_content.biography and
-- about_content.approach_to_patient_care. Those are specific claims about
-- Dr Nogaga's own background and voice — they must come from the practice,
-- not be written on their behalf. They stay null/pending; the About page
-- (Phase 4 frontend) shows an honest "being finalised" message instead of
-- either of these placeholders until the practice provides real copy.
-- ============================================================================

update public.homepage_content set
  hero_title = 'Restoring Function. Restoring Confidence.',
  hero_text = 'Specialist plastic and reconstructive surgery, with practices in East London and Mthatha, focused on careful, patient-centred care.',
  hero_cta_primary_label = 'Book a Consultation',
  hero_cta_primary_url = '/consultation',
  hero_cta_secondary_label = 'Meet Dr Nogaga',
  hero_cta_secondary_url = '/about',

  intro_text = 'Dr Viwe Nogaga is a Plastic & Reconstructive Surgeon practising in East London and Mthatha, offering reconstructive, breast and aesthetic surgery with a focus on careful, individualised patient care.',

  reconstructive_heading = 'Reconstruction That Restores More Than Appearance',
  reconstructive_text = 'Reconstructive surgery addresses the effects of trauma, illness and congenital conditions — helping restore function, comfort and confidence.',

  patient_journey = '[
    {"title": "Enquire", "text": "Reach out via the website, phone or WhatsApp."},
    {"title": "Consultation", "text": "An assessment of your needs, goals and medical history."},
    {"title": "Treatment Plan", "text": "Your options, risks and expected recovery are discussed in detail."},
    {"title": "Procedure", "text": "Surgery is carried out at an appropriate facility."},
    {"title": "Follow-up", "text": "Post-operative guidance and ongoing care."}
  ]'::jsonb,

  consultation_cta_heading = 'Ready to take the next step?',
  consultation_cta_text = 'Submit a consultation enquiry and the practice will be in touch to confirm your appointment.'
where id = true;
