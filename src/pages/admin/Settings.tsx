import { useEffect, useState, type ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { DataState } from "@/components/public/DataState";
import { FormSection } from "@/components/admin/AdminFormShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getSiteSettings } from "@/lib/supabase/queries";
import { getAllPracticeLocations, getAllProfiles } from "@/lib/supabase/adminQueries";
import { updateSiteSettings } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import type { PracticeLocation, Profile, SiteSettings as SiteSettingsRow } from "@/types/content";
import { StaffSection } from "@/components/admin/StaffSection";
import { PracticeLocationsSection } from "@/components/admin/PracticeLocationsSection";

type SettingsData = {
  settings: SiteSettingsRow;
  locations: PracticeLocation[];
  profiles: Profile[];
};

async function loadSettings() {
  const [settings, locations, profiles] = await Promise.all([
    getSiteSettings(),
    getAllPracticeLocations(),
    getAllProfiles(),
  ]);
  if (settings.error || !settings.data) {
    return { data: null, error: settings.error ?? new Error("Site settings not found") };
  }
  return {
    data: {
      settings: settings.data,
      locations: locations.data ?? [],
      profiles: (profiles.data ?? []) as Profile[],
    } satisfies SettingsData,
    error: null,
  };
}

export function Settings() {
  const { data, loading, error, refetch } = useSupabaseQuery<SettingsData>(loadSettings, []);

  return (
    <div>
      <h1 className="text-2xl text-ink">Settings</h1>
      <p className="mt-1 text-sm text-muted">Site-wide contact details, locations and staff access.</p>

      <DataState loading={loading} error={error}>
        {data && (
          <div className="mt-8 max-w-3xl space-y-8">
            <SiteSettingsForm initial={data.settings} />
            <PracticeLocationsSection initial={data.locations} onSaved={refetch} />
            <StaffSection initial={data.profiles} onChanged={refetch} />
          </div>
        )}
      </DataState>
    </div>
  );
}

function SiteSettingsForm({ initial }: { initial: SiteSettingsRow }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(initial), [initial]);

  function field<K extends keyof SiteSettingsRow>(key: K) {
    return {
      value: (form[key] as string) ?? "",
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  function numberField<K extends keyof SiteSettingsRow>(key: K) {
    return {
      value: form[key] != null ? String(form[key]) : "",
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value ? Number(e.target.value) : null })),
    };
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await updateSiteSettings({
      contact_phone: form.contact_phone,
      contact_whatsapp: form.contact_whatsapp,
      contact_email: form.contact_email,
      address: form.address,
      operating_hours: form.operating_hours,
      map_embed_url: form.map_embed_url,
      footer_copyright_text: form.footer_copyright_text,
      footer_disclaimer_text: form.footer_disclaimer_text,
      seo_default_title: form.seo_default_title,
      seo_default_description: form.seo_default_description,
      seo_og_image_url: form.seo_og_image_url,
      consultation_fee_medical_aid: form.consultation_fee_medical_aid,
      consultation_fee_cash: form.consultation_fee_cash,
    });
    setSaving(false);
    toast.show(error ? "error" : "success", error ? "Couldn't save settings." : "Settings saved.");
  }

  return (
    <FormSection title="Site Settings">
      <div className="grid grid-cols-2 gap-4">
        <Field label="General phone (fallback)" {...field("contact_phone")} />
        <Field label="General WhatsApp (fallback)" {...field("contact_whatsapp")} />
      </div>
      <p className="text-xs text-muted">
        These are fallbacks only — East London and Mthatha have their own numbers, managed below.
      </p>
      <Field label="Contact email" {...field("contact_email")} />
      <Field label="Address (fallback)" {...field("address")} />
      <Textarea label="Operating hours" rows={2} {...field("operating_hours")} />
      <Field label="Map embed URL" {...field("map_embed_url")} />

      <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
        <Field label="Consultation fee (medical aid, ZAR)" type="number" {...numberField("consultation_fee_medical_aid")} />
        <Field label="Consultation fee (cash, ZAR)" type="number" {...numberField("consultation_fee_cash")} />
      </div>

      <div className="border-t border-line pt-4 space-y-4">
        <Field label="Default SEO title" {...field("seo_default_title")} />
        <Textarea label="Default SEO description" rows={2} {...field("seo_default_description")} />
        <ImageUploadField
          label="Default social share image"
          bucket="public-assets"
          value={form.seo_og_image_url}
          onChange={(url) => setForm((f) => ({ ...f, seo_og_image_url: url }))}
        />
      </div>

      <div className="border-t border-line pt-4 space-y-4">
        <Textarea label="Footer copyright text" rows={1} {...field("footer_copyright_text")} />
        <Textarea label="Footer disclaimer text" rows={2} {...field("footer_disclaimer_text")} />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Settings
        </Button>
      </div>
    </FormSection>
  );
}
