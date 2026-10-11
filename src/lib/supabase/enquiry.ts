// ============================================================================
// Phase 6 — the public consultation form's only way to write to the
// database. Both RPCs are SECURITY DEFINER (migration
// 20261006090000_submit_enquiry_function.sql) for reasons documented in
// that file: submit_enquiry so the form can get a real reference number
// back without hitting the RETURNING-visibility wall `anon` runs into on a
// direct insert+select (the same mechanism as the Phase 5 audit.ts
// comment), and get_thursday_availability so the date picker can show
// real remaining-slot counts without needing SELECT on enquiries itself.
// ============================================================================
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

export type SubmitEnquiryInput = {
  firstName: string;
  surname: string;
  phone: string;
  email: string | null;
  preferredContactMethod: Database["public"]["Enums"]["preferred_contact_method"];
  areaOfEnquiry: string | null;
  practiceLocationId: string | null;
  appointmentType: Database["public"]["Enums"]["appointment_type"];
  /** 'YYYY-MM-DD', or null for "no preference yet" — the trigger skips the Thursday/Monday check entirely when this is null. */
  preferredDate: string | null;
  message: string | null;
  consent: boolean;
};

/**
 * Returns { id, reference } on success — reference is the human-friendly
 * ENQ-YYYY-NNNNN shown to the patient.
 *
 * The `?? undefined` conversions below exist because of how Supabase's own
 * type generator represents a `default null` RPC parameter (migration
 * 20261009090000_submit_enquiry_optional_params.sql): it marks the
 * property optional (`p_email?: string`) but does NOT union it with
 * `null` the way a nullable table column gets `| null` — so TypeScript
 * accepts the key being omitted, but not an explicit `null` value.
 * `SubmitEnquiryInput` still uses `null` throughout (it's the natural
 * "no value" state for a controlled form field), so this is the one place
 * that gets translated. Functionally identical either way: supabase-js
 * JSON-serializes the call, which drops `undefined` properties entirely,
 * and an RPC call that omits a defaulted parameter gets the same `null`
 * Postgres would've used for an explicit one.
 */
export function submitEnquiry(input: SubmitEnquiryInput) {
  return supabase
    .rpc("submit_enquiry", {
      p_first_name: input.firstName,
      p_surname: input.surname,
      p_phone: input.phone,
      p_email: input.email ?? undefined,
      p_preferred_contact_method: input.preferredContactMethod,
      p_area_of_enquiry: input.areaOfEnquiry ?? undefined,
      p_practice_location_id: input.practiceLocationId ?? undefined,
      p_appointment_type: input.appointmentType,
      p_preferred_date: input.preferredDate ?? undefined,
      p_message: input.message ?? undefined,
      p_consent: input.consent,
    })
    .single();
}

export type ThursdaySlot = { slot_date: string; booked_count: number; is_available: boolean };

/** Real remaining-capacity data for every Thursday between the two dates (inclusive) — never a client-side guess. */
export function getThursdayAvailability(fromDate: string, toDate: string) {
  return supabase.rpc("get_thursday_availability", { from_date: fromDate, to_date: toDate });
}