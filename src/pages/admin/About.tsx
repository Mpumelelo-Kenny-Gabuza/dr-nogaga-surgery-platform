import { useEffect, useState, type ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { DataState } from "@/components/public/DataState";
import { FormSection } from "@/components/admin/AdminFormShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { RepeatableList } from "@/components/admin/RepeatableList";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAboutContent, getAffiliations, getQualifications, getTeamMembers } from "@/lib/supabase/queries";
import { updateAboutContent, replaceQualifications, replaceAffiliations, replaceTeamMembers } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import type { AboutAffiliation, AboutContent, AboutQualification, TeamMember } from "@/types/content";

type AboutData = {
  about: AboutContent | null;
  qualifications: AboutQualification[];
  affiliations: AboutAffiliation[];
  team: TeamMember[];
};

async function loadAbout() {
  const [about, qualifications, affiliations, team] = await Promise.all([
    getAboutContent(),
    getQualifications(),
    getAffiliations(),
    getTeamMembers(),
  ]);
  return {
    data: {
      about: about.data,
      qualifications: qualifications.data ?? [],
      affiliations: affiliations.data ?? [],
      team: team.data ?? [],
    } satisfies AboutData,
    error: qualifications.error ?? affiliations.error ?? team.error ?? null,
  };
}

export function About() {
  const { data, loading, error } = useSupabaseQuery<AboutData>(loadAbout, []);

  return (
    <div>
      <h1 className="text-2xl text-ink">About Dr Nogaga</h1>
      <p className="mt-1 text-sm text-muted">Biography, qualifications, affiliations and team.</p>

      <DataState loading={loading} error={error}>
        {data?.about && <AboutForm initial={{ ...data, about: data.about }} />}
      </DataState>
    </div>
  );
}

function AboutForm({
  initial,
}: {
  initial: AboutData & { about: AboutContent };
}) {
  const toast = useToast();
  const [form, setForm] = useState(initial.about);
  const [qualifications, setQualifications] = useState(initial.qualifications);
  const [affiliations, setAffiliations] = useState(initial.affiliations);
  const [team, setTeam] = useState(initial.team);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial.about);
    setQualifications(initial.qualifications);
    setAffiliations(initial.affiliations);
    setTeam(initial.team);
  }, [initial]);

  function field<K extends keyof AboutContent>(key: K) {
    return {
      value: (form[key] as string) ?? "",
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function handleSave() {
    setSaving(true);
    const [{ error: aboutError }, { error: qualError }, { error: affError }, { error: teamError }] =
      await Promise.all([
        updateAboutContent(form),
        replaceQualifications(
          qualifications.map(({ title, institution, year_obtained }) => ({
            title,
            institution,
            year_obtained,
          }))
        ),
        replaceAffiliations(affiliations.map(({ kind, name }) => ({ kind, name }))),
        replaceTeamMembers(
          team.map(({ full_name, role_title, bio, photo_url, published }) => ({
            full_name,
            role_title,
            bio,
            photo_url,
            published,
          }))
        ),
      ]);
    setSaving(false);

    if (aboutError || qualError || affError || teamError) {
      toast.show("error", "Couldn't save — please try again.");
    } else {
      toast.show("success", "About page saved.");
    }
  }

  return (
    <div className="mt-8 max-w-3xl space-y-8">
      <FormSection title="Biography">
        <Field label="Full name" {...field("full_name")} />
        <Field label="Professional title" {...field("professional_title")} />
        <ImageUploadField
          label="Profile photo"
          bucket="profile-images"
          value={form.profile_image_url}
          onChange={(url) => setForm((f) => ({ ...f, profile_image_url: url }))}
        />
        <Textarea
          label="Biography"
          rows={6}
          hint="Leave blank until the practice provides final wording — the public About page shows a 'being finalised' message rather than placeholder text."
          {...field("biography")}
        />
        <Textarea label="Approach to patient care" rows={4} {...field("approach_to_patient_care")} />
      </FormSection>

      <FormSection title="Qualifications">
        <RepeatableList
          items={qualifications}
          onChange={setQualifications}
          addLabel="Add qualification"
          newItem={() => ({
            id: crypto.randomUUID(),
            title: "",
            institution: null,
            year_obtained: null,
            display_order: qualifications.length,
            created_at: new Date().toISOString(),
          })}
          renderItem={(q, update) => (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Title" value={q.title} onChange={(e) => update({ title: e.target.value })} />
              <Field
                label="Institution"
                value={q.institution ?? ""}
                onChange={(e) => update({ institution: e.target.value || null })}
              />
              <Field
                label="Year"
                type="number"
                value={q.year_obtained ?? ""}
                onChange={(e) => update({ year_obtained: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          )}
        />
      </FormSection>

      <FormSection title="Affiliations & Memberships">
        <RepeatableList
          items={affiliations}
          onChange={setAffiliations}
          addLabel="Add affiliation"
          newItem={() => ({
            id: crypto.randomUUID(),
            kind: "AFFILIATION",
            name: "",
            display_order: affiliations.length,
            created_at: new Date().toISOString(),
          })}
          renderItem={(a, update) => (
            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Type"
                value={a.kind}
                onChange={(e) => update({ kind: e.target.value })}
                className="col-span-1"
              >
                <option value="AFFILIATION">Affiliation</option>
                <option value="MEMBERSHIP">Membership</option>
              </Select>
              <div className="col-span-2">
                <Field label="Name" value={a.name} onChange={(e) => update({ name: e.target.value })} />
              </div>
            </div>
          )}
        />
      </FormSection>

      <FormSection title="Team">
        <RepeatableList
          items={team}
          onChange={setTeam}
          addLabel="Add team member"
          newItem={() => ({
            id: crypto.randomUUID(),
            full_name: "",
            role_title: null,
            bio: null,
            photo_url: null,
            display_order: team.length,
            published: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })}
          renderItem={(member, update) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Full name"
                  value={member.full_name}
                  onChange={(e) => update({ full_name: e.target.value })}
                />
                <Field
                  label="Role"
                  value={member.role_title ?? ""}
                  onChange={(e) => update({ role_title: e.target.value || null })}
                />
              </div>
              <ImageUploadField
                label="Photo"
                bucket="profile-images"
                value={member.photo_url}
                onChange={(url) => update({ photo_url: url })}
              />
              <Textarea
                label="Short bio"
                rows={2}
                value={member.bio ?? ""}
                onChange={(e) => update({ bio: e.target.value || null })}
              />
              <Toggle
                label="Published"
                checked={member.published}
                onChange={(checked) => update({ published: checked })}
              />
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
