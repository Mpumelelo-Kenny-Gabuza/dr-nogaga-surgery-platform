-- ============================================================================
-- Phase 6 — fixes a real gap found while building the public consultation
-- form, and adds the function that form calls.
--
-- THE BUG: check_thursday_capacity() (migration 20261002110000) counts
-- existing bookings with a plain `select count(*) from public.enquiries`.
-- That function has no SECURITY DEFINER, so it runs with the privileges of
-- whoever's INSERT fired it. For a genuine public submission that's the
-- `anon` role — which has no SELECT policy on enquiries at all ("only
-- staff may read enquiries"), so the count is always 0 to anon's eyes and
-- the "max 5 per Thursday" cap silently never engages for real patients.
-- It only ever worked when staff made the booking, since is_staff() grants
-- them SELECT visibility. Verified both ways against a local Postgres
-- instance before and after this fix — see the Phase 6 section of the
-- README for the exact reproduction.
--
-- THE FIX: add SECURITY DEFINER to the existing trigger function (same
-- body otherwise) so its internal count runs as the function's owner
-- regardless of who triggered it, closing the gap for every insert path —
-- not just the RPC below.
-- ============================================================================
create or replace function public.check_thursday_capacity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  booked_count integer;
begin
  if new.appointment_type <> 'NEW_CONSULTATION' or new.preferred_date is null then
    return new;
  end if;

  select count(*) into booked_count
  from public.enquiries
  where preferred_date = new.preferred_date
    and appointment_type = 'NEW_CONSULTATION'
    and status <> 'CANCELLED'
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if booked_count >= 5 then
    raise exception 'That Thursday is fully booked (5 of 5 consultations). Please choose another date.';
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- submit_enquiry — the only function the public consultation form calls.
--
-- A plain `supabase.from('enquiries').insert(values)` would work for the
-- insert itself (RLS already allows it — "anyone may submit a consultation
-- enquiry"), but the moment the client chains `.select()` to get the
-- auto-generated `reference` back for the confirmation screen, PostgREST
-- adds a RETURNING clause, and Postgres then re-checks the inserted row
-- against the table's SELECT policies before handing it back — which fail
-- for anon ("only staff may read enquiries"), producing "new row violates
-- row-level security policy" even though the insert itself was allowed.
-- (Exactly the mechanism documented in the Phase 5 audit.ts comment.)
--
-- Wrapping the insert in a SECURITY DEFINER function sidesteps that: it
-- returns only the two fields a patient needs (id, reference), never the
-- row itself, so nothing else about the table's shape or other enquiries
-- is ever exposed to an anonymous caller.
-- ----------------------------------------------------------------------------
create or replace function public.submit_enquiry(
  p_first_name text,
  p_surname text,
  p_phone text,
  p_email text,
  p_preferred_contact_method public.preferred_contact_method,
  p_area_of_enquiry text,
  p_practice_location_id uuid,
  p_appointment_type public.appointment_type,
  p_preferred_date date,
  p_message text,
  p_consent boolean
)
returns table (id uuid, reference text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
  v_reference text;
begin
  -- POPIA consent (spec §17/§37) is required at the application layer;
  -- this function is now that layer for every public submission, so it
  -- enforces it directly rather than trusting the client sent true.
  if not coalesce(p_consent, false) then
    raise exception 'Consent is required to submit an enquiry.';
  end if;

  if length(trim(coalesce(p_first_name, ''))) = 0
    or length(trim(coalesce(p_surname, ''))) = 0
    or length(trim(coalesce(p_phone, ''))) = 0 then
    raise exception 'First name, surname and phone are required.';
  end if;

  insert into public.enquiries (
    first_name, surname, phone, email, preferred_contact_method,
    area_of_enquiry, practice_location_id, appointment_type,
    preferred_date, message, consent, status
  ) values (
    p_first_name, p_surname, p_phone, p_email, p_preferred_contact_method,
    p_area_of_enquiry, p_practice_location_id, p_appointment_type,
    p_preferred_date, p_message, true, 'NEW'
  )
  returning enquiries.id, enquiries.reference into v_id, v_reference;

  return query select v_id, v_reference;
end;
$$;

comment on function public.submit_enquiry is
  'The only entry point the public consultation form uses. SECURITY DEFINER so it can hand back {id, reference} without the RETURNING-visibility problem anon hits on a direct insert+select — see the comment above for the exact mechanism.';

grant execute on function public.submit_enquiry(
  text, text, text, text, public.preferred_contact_method, text, uuid,
  public.appointment_type, date, text, boolean
) to anon, authenticated;
