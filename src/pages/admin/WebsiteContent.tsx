import { useEffect, useState, type ChangeEvent } from "react";
import { DataState } from "@/components/public/DataState";
import { FormSection } from "@/components/admin/AdminFormShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { RepeatableList } from "@/components/admin/RepeatableList";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getHomepageContent, getSocialLinks } from "@/lib/supabase/queries";
import { updateHomepageContent, replaceSocialLinks } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import { parsePatientJourney } from "@/types/content";
import type { HomepageContent, PatientJourneyStep, SocialLink } from "@/types/content";
import { Loader2 } from "lucide-react";

type ContentData = { homepage: HomepageContent; socialLinks: SocialLink[] };

async function loadContent() {
  const [homepage, socialLinks] = await Promise.all([getHomepageContent(), getSocialLinks()]);
  if (homepage.error || !homepage.data) {
    return { data: null, error: homepage.error ?? new Error("Homepage content not found") };
  }
  return {
    data: { homepage: homepage.data, socialLinks: socialLinks.data ?? [] } satisfies ContentData,
    error: null,
  };
}

export function WebsiteContent() {
  const { data, loading, error } = useSupabaseQuery<ContentData>(loadContent, []);

  return (
    <div>
      <h1 className="text-2xl text-ink">Website Content</h1>
      <p className="mt-1 text-sm text-muted">The homepage hero, intro and consultation call-to-action.</p>

      <DataState loading={loading} error={error}>
        {data && <ContentForm initial={data} />}
      </DataState>
    </div>
  );
}

function ContentForm({ initial }: { initial: ContentData }) {
  const toast = useToast();
  const [form, setForm] = useState(initial.homepage);
  const [journey, setJourney] = useState<PatientJourneyStep[]>(
    parsePatientJourney(initial.homepage.patient_journey)
  );
  const [links, setLinks] = useState(initial.socialLinks);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial.homepage);
    setJourney(parsePatientJourney(initial.homepage.patient_journey));
    setLinks(initial.socialLinks);
  }, [initial]);

  function field<K extends keyof HomepageContent>(key: K) {
    return {
      value: (form[key] as string) ?? "",
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function handleSave() {
    setSaving(true);
    const [{ error: contentError }, { error: linksError }] = await Promise.all([
      updateHomepageContent({ ...form, patient_journey: journey }),
      replaceSocialLinks(
        links.map(({ platform, url, published }) => ({ platform, url, published }))
      ),
    ]);
    setSaving(false);

    if (contentError || linksError) {
      toast.show("error", "Couldn't save — please try again.");
    } else {
      toast.show("success", "Website content saved.");
    }
  }

  return (
    <div className="mt-8 max-w-3xl space-y-8">
      <FormSection title="Hero">
        <Field label="Kicker (small line above the headline)" {...field("hero_kicker")} />
        <Field label="Headline" {...field("hero_title")} />
        <Textarea label="Subtext" rows={3} {...field("hero_text")} />
        <ImageUploadField
          label="Hero image"
          bucket="public-assets"
          value={form.hero_image_url}
          onChange={(url) => setForm((f) => ({ ...f, hero_image_url: url }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary button label" {...field("hero_cta_primary_label")} />
          <Field label="Primary button link" {...field("hero_cta_primary_url")} />
          <Field label="Secondary button label" {...field("hero_cta_secondary_label")} />
          <Field label="Secondary button link" {...field("hero_cta_secondary_url")} />
        </div>
      </FormSection>

      <FormSection title="Introduction">
        <Field label="Heading" {...field("intro_heading")} />
        <Textarea label="Text" rows={3} {...field("intro_text")} />
      </FormSection>

      <FormSection title="Reconstructive Surgery Highlight">
        <Field label="Heading" {...field("reconstructive_heading")} />
        <Textarea label="Text" rows={3} {...field("reconstructive_text")} />
      </FormSection>

      <FormSection title="Patient Journey Steps">
        <RepeatableList
          items={journey}
          onChange={setJourney}
          addLabel="Add step"
          newItem={() => ({ title: "", text: "" })}
          renderItem={(step, update) => (
            <div className="space-y-2">
              <Field
                label="Step title"
                value={step.title}
                onChange={(e) => update({ title: e.target.value })}
              />
              <Textarea
                label="Step text"
                rows={2}
                value={step.text}
                onChange={(e) => update({ text: e.target.value })}
              />
            </div>
          )}
        />
      </FormSection>

      <FormSection title="Consultation Call-to-Action">
        <Field label="Heading" {...field("consultation_cta_heading")} />
        <Textarea label="Text" rows={2} {...field("consultation_cta_text")} />
      </FormSection>

      <FormSection title="Social Links">
        <RepeatableList
          items={links}
          onChange={setLinks}
          addLabel="Add social link"
          newItem={() => ({
            id: crypto.randomUUID(),
            platform: "",
            url: "",
            display_order: links.length,
            published: true,
            created_at: new Date().toISOString(),
          })}
          renderItem={(link, update) => (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Platform"
                value={link.platform}
                onChange={(e) => update({ platform: e.target.value })}
              />
              <Field label="URL" value={link.url} onChange={(e) => update({ url: e.target.value })} />
            </div>
          )}
        />
      </FormSection>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
