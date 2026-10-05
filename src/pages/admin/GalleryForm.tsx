import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminFormShell, FormSection } from "@/components/admin/AdminFormShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { DataState } from "@/components/public/DataState";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getGalleryItemById } from "@/lib/supabase/adminQueries";
import { createGalleryItem, deleteGalleryItem, updateGalleryItem } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import type { GalleryItem } from "@/types/content";

type FormState = {
  image_url: string | null;
  caption: string;
  alt_text: string;
  category: string;
  published: boolean;
};

const BLANK: FormState = { image_url: null, caption: "", alt_text: "", category: "", published: false };

function toFormState(g: GalleryItem): FormState {
  return {
    image_url: g.image_url,
    caption: g.caption ?? "",
    alt_text: g.alt_text ?? "",
    category: g.category ?? "",
    published: g.published,
  };
}

export function GalleryForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading, error } = useSupabaseQuery<GalleryItem | null>(
    async () => (isNew ? { data: null, error: null } : await getGalleryItemById(id!)),
    [id]
  );

  const [form, setForm] = useState<FormState>(BLANK);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (data) setForm(toFormState(data));
  }, [data]);

  async function handleSave() {
    if (!form.image_url) {
      setSaveError("Please upload an image first.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    const values = {
      image_url: form.image_url,
      caption: form.caption || null,
      alt_text: form.alt_text || null,
      category: form.category || null,
      published: form.published,
    };

    const { data: saved, error } = isNew
      ? await createGalleryItem(values)
      : await updateGalleryItem(id!, values);

    setSaving(false);

    if (error || !saved) {
      setSaveError(error?.message ?? "Couldn't save this image.");
      return;
    }

    toast.show("success", isNew ? "Image added." : "Image saved.");
    if (isNew) navigate(`/admin/gallery/${saved.id}`, { replace: true });
  }

  async function handleDelete() {
    if (!id) return;
    const { error } = await deleteGalleryItem(id);
    setConfirmDelete(false);
    if (error) {
      toast.show("error", "Couldn't delete this image.");
    } else {
      toast.show("success", "Image deleted.");
      navigate("/admin/gallery");
    }
  }

  return (
    <DataState loading={loading} error={error}>
      <AdminFormShell
        title={isNew ? "Add Image" : "Edit Image"}
        backTo="/admin/gallery"
        saving={saving}
        onSave={handleSave}
        onDelete={isNew ? undefined : () => setConfirmDelete(true)}
        error={saveError}
      >
        <FormSection>
          <ImageUploadField
            label="Image"
            bucket="gallery-images"
            value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
          />
          <Field label="Caption" value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} />
          <Field
            label="Alt text"
            value={form.alt_text}
            onChange={(e) => setForm((f) => ({ ...f, alt_text: e.target.value }))}
            hint="Describes the image for screen readers — keep it short and specific."
          />
          <Field
            label="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            hint="e.g. Practice, Procedures, Reconstructive, Educational, General"
          />
          <Toggle
            label="Published"
            checked={form.published}
            onChange={(checked) => setForm((f) => ({ ...f, published: checked }))}
          />
        </FormSection>
      </AdminFormShell>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this image?"
        description="This image will be permanently removed from the gallery. This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </DataState>
  );
}
