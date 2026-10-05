import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminFormShell, FormSection } from "@/components/admin/AdminFormShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { DataState } from "@/components/public/DataState";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAllProcedures, getTestimonialById } from "@/lib/supabase/adminQueries";
import { createTestimonial, deleteTestimonial, updateTestimonial } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import type { Database } from "@/types/database.types";
import type { Procedure, Testimonial } from "@/types/content";

type FormState = {
  display_name: string;
  testimonial_text: string;
  image_url: string | null;
  procedure_id: string | null;
  status: Database["public"]["Enums"]["content_status"];
  is_featured: boolean;
  display_order: number;
};

const BLANK: FormState = {
  display_name: "",
  testimonial_text: "",
  image_url: null,
  procedure_id: null,
  status: "DRAFT",
  is_featured: false,
  display_order: 0,
};

function toFormState(t: Testimonial): FormState {
  return {
    display_name: t.display_name,
    testimonial_text: t.testimonial_text,
    image_url: t.image_url,
    procedure_id: t.procedure_id,
    status: t.status,
    is_featured: t.is_featured,
    display_order: t.display_order,
  };
}

export function TestimonialForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading, error } = useSupabaseQuery<{ testimonial: Testimonial | null; procedures: Procedure[] }>(
    async () => {
      const [testimonial, procedures] = await Promise.all([
        isNew ? Promise.resolve({ data: null, error: null }) : getTestimonialById(id!),
        getAllProcedures(),
      ]);
      if (!isNew && (testimonial.error || !testimonial.data)) {
        return { data: null, error: testimonial.error ?? new Error("Testimonial not found") };
      }
      return {
        data: { testimonial: testimonial.data, procedures: (procedures.data ?? []) as Procedure[] },
        error: null,
      };
    },
    [id]
  );

  const [form, setForm] = useState<FormState>(BLANK);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (data?.testimonial) setForm(toFormState(data.testimonial));
  }, [data]);

  async function handleSave() {
    if (!form.display_name.trim() || !form.testimonial_text.trim()) {
      setSaveError("Patient name and testimonial text are required.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    const values = {
      display_name: form.display_name,
      testimonial_text: form.testimonial_text,
      image_url: form.image_url,
      procedure_id: form.procedure_id,
      status: form.status,
      is_featured: form.is_featured,
      display_order: form.display_order,
    };

    const { data: saved, error } = isNew
      ? await createTestimonial(values)
      : await updateTestimonial(id!, values);

    setSaving(false);

    if (error || !saved) {
      setSaveError(error?.message ?? "Couldn't save this testimonial.");
      return;
    }

    toast.show("success", isNew ? "Testimonial added." : "Testimonial saved.");
    if (isNew) navigate(`/admin/testimonials/${saved.id}`, { replace: true });
  }

  async function handleDelete() {
    if (!id) return;
    const { error } = await deleteTestimonial(id);
    setConfirmDelete(false);
    if (error) {
      toast.show("error", "Couldn't delete this testimonial.");
    } else {
      toast.show("success", "Testimonial deleted.");
      navigate("/admin/testimonials");
    }
  }

  return (
    <DataState loading={loading} error={error}>
      {(data || isNew) && (
        <>
          <AdminFormShell
            title={isNew ? "Add Testimonial" : form.display_name || "Edit Testimonial"}
            backTo="/admin/testimonials"
            saving={saving}
            onSave={handleSave}
            onDelete={isNew ? undefined : () => setConfirmDelete(true)}
            error={saveError}
          >
            <FormSection>
              <Field
                label="Patient name"
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                hint="As the patient wants to be credited (e.g. first name only, or 'Anonymous')."
              />
              <Textarea
                label="Testimonial"
                rows={5}
                value={form.testimonial_text}
                onChange={(e) => setForm((f) => ({ ...f, testimonial_text: e.target.value }))}
              />
              <ImageUploadField
                label="Patient photo (optional)"
                bucket="profile-images"
                value={form.image_url}
                onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
              />
              <Select
                label="Related procedure (optional)"
                value={form.procedure_id ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, procedure_id: e.target.value || null }))}
              >
                <option value="">— None —</option>
                {data?.procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </FormSection>

            <FormSection title="Publishing">
              <Select
                label="Status"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as Database["public"]["Enums"]["content_status"],
                  }))
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
              <Toggle
                label="Featured"
                description="Shown on the homepage."
                checked={form.is_featured}
                onChange={(checked) => setForm((f) => ({ ...f, is_featured: checked }))}
              />
            </FormSection>
          </AdminFormShell>

          <ConfirmDialog
            open={confirmDelete}
            title="Delete this testimonial?"
            description={`The testimonial from "${form.display_name}" will be permanently removed. This can't be undone.`}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        </>
      )}
    </DataState>
  );
}
