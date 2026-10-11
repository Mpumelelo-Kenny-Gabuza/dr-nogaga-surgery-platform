-- ============================================================================
-- Fixes a type-generation mismatch in submit_enquiry (migration
-- 20261006090000_submit_enquiry_function.sql), caught by `npm run
-- typecheck` once types were regenerated against a real project.
--
-- THE PROBLEM: p_email, p_area_of_enquiry, p_practice_location_id,
-- p_preferred_date and p_message were declared with no DEFAULT. Postgres
-- allows NULL for any of them at call time regardless (nothing here was
-- ever NOT NULL), but `supabase gen types` only infers "this argument may
-- be omitted/null" from the presence of a DEFAULT — with none, it
-- generated five Args fields as plain `string`/`uuid`/`date`, not
-- `... | null`. src/lib/supabase/enquiry.ts correctly types these as
-- optional (the consultation form lets a patient skip email, area of
-- enquiry, practice location, preferred date and message), so passing its
-- `string | null` values against the generated `string` Args type fails
-- `npm run typecheck` / `npm run build`.
--
-- THE FIX: give those five parameters `default null`. Postgres requires
-- every parameter after the first defaulted one to also have a default,
-- so the five are moved to the end of the parameter list; everything
-- else (name, type, function body, SECURITY DEFINER) is unchanged. This
-- only affects how `supabase gen types` describes the function — Supabase
-- calls RPCs with named JSON arguments (see enquiry.ts's `.rpc("submit_enquiry",
-- { p_first_name: ..., ... })`), never positionally, so reordering the
-- declaration changes nothing about how existing callers behave.
--
-- Because the parameter *order* changes, this is a different signature as
-- far as Postgres is concerned — `create or replace` would add a second,
-- overloaded function rather than replace the first, so the old signature
-- is dropped explicitly first.
-- ============================================================================
drop function if exists public.submit_enquiry(
  text, text, text, text, public.preferred_contact_method, text, uuid,
  public.appointment_type, date, text, boolean
);

create or replace function public.submit_enquiry(
  p_first_name text,
  p_surname text,
  p_phone text,
  p_preferred_contact_method public.preferred_contact_method,
  p_appointment_type public.appointment_type,
  p_consent boolean,
  p_email text default null,
  p_area_of_enquiry text default null,
  p_practice_location_id uuid default null,
  p_preferred_date date default null,
  p_message text default null
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
  'The only entry point the public consultation form uses. SECURITY DEFINER so it can hand back {id, reference} without the RETURNING-visibility problem anon hits on a direct insert+select — see migration 20261006090000''s comment for the exact mechanism.';

grant execute on function public.submit_enquiry(
  text, text, text, public.preferred_contact_method, public.appointment_type,
  boolean, text, text, uuid, date, text
) to anon, authenticated;
