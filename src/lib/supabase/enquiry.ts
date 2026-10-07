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

/** Returns { id, reference } on success — reference is the human-friendly ENQ-YYYY-NNNNN shown to the patient. */
export function submitEnquiry(input: SubmitEnquiryInput) {
  return supabase
    .rpc("submit_enquiry", {
      p_first_name: input.firstName,
      p_surname: input.surname,
      p_phone: input.phone,
      p_email: input.email,
      p_preferred_contact_method: input.preferredContactMethod,
      p_area_of_enquiry: input.areaOfEnquiry,
      p_practice_location_id: input.practiceLocationId,
      p_appointment_type: input.appointmentType,
      p_preferred_date: input.preferredDate,
      p_message: input.message,
      p_consent: input.consent,
    })
    .single();
}

export type ThursdaySlot = { slot_date: string; booked_count: number; is_available: boolean };

/** Real remaining-capacity data for every Thursday between the two dates (inclusive) — never a client-side guess. */
export function getThursdayAvailability(fromDate: string, toDate: string) {
  return supabase.rpc("get_thursday_availability", { from_date: fromDate, to_date: toDate });
}
