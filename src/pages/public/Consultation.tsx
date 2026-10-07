import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import clsx from "clsx";
import { PageHero } from "@/components/public/PageHero";
import { Container } from "@/components/ui/Container";
import { DataState } from "@/components/public/DataState";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getPracticeLocations, getPublishedProcedures, getSiteSettings } from "@/lib/supabase/queries";
import { getThursdayAvailability, submitEnquiry, type ThursdaySlot } from "@/lib/supabase/enquiry";
import { formatDayMonth, nextWeekdays, toISODateLocal } from "@/lib/dates";
import type { Database } from "@/types/database.types";
import type { PracticeLocation, ProcedureWithCategory, SiteSettings } from "@/types/content";

type PreferredContactMethod = Database["public"]["Enums"]["preferred_contact_method"];
type AppointmentChoice = "NEW_CONSULTATION" | "REVIEW_FOLLOWUP" | "GENERAL";

const OTHER_AREA = "__other__";

type PageData = {
  locations: PracticeLocation[];
  procedures: ProcedureWithCategory[];
  settings: SiteSettings | null;
};

async function loadPageData() {
  const [locations, procedures, settings] = await Promise.all([
    getPracticeLocations(),
    getPublishedProcedures(),
    getSiteSettings(),
  ]);
  return {
    data: {
      locations: locations.data ?? [],
      procedures: (procedures.data ?? []) as ProcedureWithCategory[],
      settings: settings.data,
    } satisfies PageData,
    error: locations.error ?? procedures.error ?? null,
  };
}

export function Consultation() {
  usePageMeta(
    "Book a Consultation",
    "Request a consultation or ask a question about a procedure — we'll be in touch to confirm."
  );
  const { data, loading, error } = useSupabaseQuery<PageData>(loadPageData, []);

  return (
    <>
      <PageHero
        kicker="Get Started"
        title="Book a Consultation"
        subtitle="Tell us a little about what you need. We'll confirm the details and get back to you directly."
      />
      <Container className="py-16 md:py-20">
        <DataState loading={loading} error={error}>
          {data && <EnquiryForm data={data} />}
        </DataState>
      </Container>
    </>
  );
}

type FormState = {
  firstName: string;
  surname: string;
  phone: string;
  email: string;
  preferredContactMethod: PreferredContactMethod;
  areaOfEnquiry: string;
  areaOfEnquiryOther: string;
  practiceLocationId: string;
  preferredDate: string;
  message: string;
  consent: boolean;
};

const BLANK_FORM: FormState = {
  firstName: "",
  surname: "",
  phone: "",
  email: "",
  preferredContactMethod: "WHATSAPP",
  areaOfEnquiry: "",
  areaOfEnquiryOther: "",
  practiceLocationId: "",
  preferredDate: "",
  message: "",
  consent: false,
};

function EnquiryForm({ data }: { data: PageData }) {
  const [appointmentChoice, setAppointmentChoice] = useState<AppointmentChoice>("GENERAL");
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; reference: string } | null>(null);

  const [thursdaySlots, setThursdaySlots] = useState<ThursdaySlot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Real remaining-capacity data, fetched only once the patient actually
  // wants a new-patient consultation — not guessed or computed client-side.
  useEffect(() => {
    if (appointmentChoice !== "NEW_CONSULTATION") return;
    let cancelled = false;
    setLoadingSlots(true);
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 70);
    getThursdayAvailability(toISODateLocal(from), toISODateLocal(to)).then(({ data: slots, error }) => {
      if (cancelled) return;
      setThursdaySlots(error ? [] : slots ?? []);
      setLoadingSlots(false);
    });
    return () => {
      cancelled = true;
    };
  }, [appointmentChoice]);

  // Review/follow-up has no capacity cap — the next Mondays are just dates,
  // computed locally rather than round-tripping for data that doesn't exist.
  const mondayOptions = useMemo(() => nextWeekdays(new Date(), 1, 8), []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function selectAppointmentChoice(choice: AppointmentChoice) {
    setAppointmentChoice(choice);
    setForm((f) => ({ ...f, preferredDate: "" }));
  }

  async function handleSubmit() {
    setFieldError(null);
    setSubmitError(null);

    if (!form.firstName.trim() || !form.surname.trim() || !form.phone.trim()) {
      setFieldError("First name, surname and phone number are required.");
      return;
    }
    if (!form.consent) {
      setFieldError("Please confirm you consent to the practice contacting you about this enquiry.");
      return;
    }
    if (appointmentChoice !== "GENERAL" && !form.preferredDate) {
      setFieldError(
        "Please choose a date below, or switch to “General question” if you're not ready to pick one yet."
      );
      return;
    }

    const areaOfEnquiry =
      form.areaOfEnquiry === OTHER_AREA
        ? form.areaOfEnquiryOther.trim() || null
        : form.areaOfEnquiry.trim() || null;

    setSubmitting(true);
    const { data: submitted, error } = await submitEnquiry({
      firstName: form.firstName.trim(),
      surname: form.surname.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      preferredContactMethod: form.preferredContactMethod,
      areaOfEnquiry,
      practiceLocationId: form.practiceLocationId || null,
      // GENERAL maps to the schema's NEW_CONSULTATION default harmlessly —
      // it's only meaningful once a preferred_date is actually set, which
      // for a general question stays null (the trigger skips the
      // Thursday/Monday check entirely when preferred_date is null).
      appointmentType: appointmentChoice === "REVIEW_FOLLOWUP" ? "REVIEW_FOLLOWUP" : "NEW_CONSULTATION",
      preferredDate: appointmentChoice === "GENERAL" ? null : form.preferredDate,
      message: form.message.trim() || null,
      consent: form.consent,
    });
    setSubmitting(false);

    if (error || !submitted) {
      // These are the exact, deliberately patient-facing messages raised by
      // submit_enquiry() itself (fully booked / wrong day / missing
      // consent) — shown as-is rather than replaced with something generic.
      setSubmitError(error?.message ?? "Something went wrong submitting your enquiry. Please try again.");
      return;
    }

    setResult(submitted);
  }

  if (result) {
    return <SuccessPanel reference={result.reference} contactMethod={form.preferredContactMethod} settings={data.settings} />;
  }

  return (
    <div className="grid gap-12 md:grid-cols-[1fr_320px]">
      <div className="max-w-2xl space-y-8">
        <section>
          <h2 className="text-lg text-ink">What would you like to do?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ChoiceCard
              active={appointmentChoice === "NEW_CONSULTATION"}
              title="New Consultation"
              description="First-time patients — Thursdays only."
              onClick={() => selectAppointmentChoice("NEW_CONSULTATION")}
            />
            <ChoiceCard
              active={appointmentChoice === "REVIEW_FOLLOWUP"}
              title="Review / Follow-up"
              description="Existing patients — Mondays only."
              onClick={() => selectAppointmentChoice("REVIEW_FOLLOWUP")}
            />
            <ChoiceCard
              active={appointmentChoice === "GENERAL"}
              title="General Question"
              description="Not ready to pick a date yet."
              onClick={() => selectAppointmentChoice("GENERAL")}
            />
          </div>
        </section>

        {appointmentChoice === "NEW_CONSULTATION" && (
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-teal">Choose a Thursday</h3>
            {loadingSlots ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <Loader2 size={14} className="animate-spin" /> Checking availability…
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {(thursdaySlots ?? []).map((slot) => (
                  <DateOption
                    key={slot.slot_date}
                    date={slot.slot_date}
                    selected={form.preferredDate === slot.slot_date}
                    disabled={!slot.is_available}
                    label={slot.is_available ? `${5 - slot.booked_count} of 5 left` : "Fully booked"}
                    onClick={() => update("preferredDate", slot.slot_date)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {appointmentChoice === "REVIEW_FOLLOWUP" && (
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-teal">Choose a Monday</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {mondayOptions.map((date) => (
                <DateOption
                  key={date}
                  date={date}
                  selected={form.preferredDate === date}
                  onClick={() => update("preferredDate", date)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg text-ink">Your Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
            <Field label="Surname" value={form.surname} onChange={(e) => update("surname", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <Field
              label="Email (optional)"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <Select
            label="Preferred contact method"
            value={form.preferredContactMethod}
            onChange={(e) => update("preferredContactMethod", e.target.value as PreferredContactMethod)}
          >
            <option value="WHATSAPP">WhatsApp</option>
            <option value="PHONE">Phone call</option>
            <option value="EMAIL">Email</option>
          </Select>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-ink">A Little More Detail</h2>
          <Select
            label="What's this about? (optional)"
            value={form.areaOfEnquiry}
            onChange={(e) => update("areaOfEnquiry", e.target.value)}
          >
            <option value="">Select a procedure, or leave blank</option>
            {data.procedures.map((p) => (
              <option key={p.id} value={p.title}>
                {p.title}
              </option>
            ))}
            <option value={OTHER_AREA}>Something else</option>
          </Select>
          {form.areaOfEnquiry === OTHER_AREA && (
            <Field
              label="Please specify"
              value={form.areaOfEnquiryOther}
              onChange={(e) => update("areaOfEnquiryOther", e.target.value)}
            />
          )}
          {data.locations.length > 0 && (
            <Select
              label="Preferred location (optional)"
              value={form.practiceLocationId}
              onChange={(e) => update("practiceLocationId", e.target.value)}
            >
              <option value="">No preference</option>
              {data.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.display_name}
                </option>
              ))}
            </Select>
          )}
          <Textarea
            label="Anything else you'd like us to know? (optional)"
            rows={4}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
          />
        </section>

        <section>
          <label className="flex items-start gap-3 text-sm text-ink-light">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => update("consent", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-teal focus:ring-teal"
            />
            <span>
              I consent to the practice collecting and using this information to respond to my enquiry, in
              line with POPIA.
            </span>
          </label>
        </section>

        {(fieldError || submitError) && (
          <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fieldError ?? submitError}
          </div>
        )}

        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Submit Enquiry
        </Button>
      </div>

      <aside className="h-fit rounded-sm border border-line bg-cream/60 p-6 text-sm">
        <h3 className="font-semibold text-ink">Prefer to talk to us directly?</h3>
        <div className="mt-3 space-y-2 text-ink-light">
          {data.settings?.contact_phone && <p>Phone: {data.settings.contact_phone}</p>}
          {data.settings?.contact_whatsapp && <p>WhatsApp: {data.settings.contact_whatsapp}</p>}
          {data.settings?.contact_email && <p>Email: {data.settings.contact_email}</p>}
          {!data.settings?.contact_phone && !data.settings?.contact_whatsapp && !data.settings?.contact_email && (
            <p>Contact details are on our Contact page.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function ChoiceCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-sm border p-4 text-left transition-colors",
        active ? "border-teal bg-mist/40" : "border-line bg-white hover:border-teal/50"
      )}
    >
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </button>
  );
}

function DateOption({
  date,
  selected,
  disabled,
  label,
  onClick,
}: {
  date: string;
  selected: boolean;
  disabled?: boolean;
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "rounded-[3px] border px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        selected ? "border-teal bg-teal text-white" : "border-line bg-white hover:border-teal"
      )}
    >
      <span className="block font-medium">{formatDayMonth(date)}</span>
      {label && <span className={clsx("block", selected ? "text-white/80" : "text-muted")}>{label}</span>}
    </button>
  );
}

function SuccessPanel({
  reference,
  contactMethod,
  settings,
}: {
  reference: string;
  contactMethod: PreferredContactMethod;
  settings: SiteSettings | null;
}) {
  const methodLabel =
    contactMethod === "WHATSAPP" ? "WhatsApp" : contactMethod === "PHONE" ? "a phone call" : "email";

  return (
    <div className="max-w-xl rounded-sm border border-line bg-white p-8 text-center">
      <CheckCircle2 size={36} className="mx-auto text-teal" />
      <h2 className="mt-4 text-2xl text-ink">Enquiry Received</h2>
      <p className="mt-2 text-muted">
        Your reference number is <span className="font-semibold text-ink">{reference}</span>. We'll reach
        out via {methodLabel} to confirm the details.
      </p>
      {(settings?.contact_phone || settings?.contact_whatsapp) && (
        <p className="mt-4 text-sm text-muted">
          Need to reach us sooner? Call {settings?.contact_phone ?? settings?.contact_whatsapp}.
        </p>
      )}
    </div>
  );
}
