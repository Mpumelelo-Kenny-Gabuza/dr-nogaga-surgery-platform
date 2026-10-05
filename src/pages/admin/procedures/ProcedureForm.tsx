import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminFormShell, FormSection } from "@/components/admin/AdminFormShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { RepeatableList } from "@/components/admin/RepeatableList";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { DataState } from "@/components/public/DataState";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import {
  getAllFaqs,
  getProcedureById,
  getProcedureFaqIds,
} from "@/lib/supabase/adminQueries";
import { getProcedureCategories, getProcedureImages } from "@/lib/supabase/queries";
import {
  createProcedure,
  deleteProcedure,
  replaceProcedureImages,
  setProcedureFaqs,
  updateProcedure,
} from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import { slugify } from "@/lib/slug";
import type { Database } from "@/types/database.types";
import type { Faq, ProcedureCategory, ProcedureImage, ProcedureWithCategory } from "@/types/content";

type FormState = {
  title: string;
  slug: string;
  category_id: string | null;
  short_description: string;
  full_description: string;
  featured_image_url: string | null;
  patient_information: string;
  preparation_information: string;
  recovery_information: string;
  risks_disclaimer: string;
  seo_title: string;
  seo_description: string;
  status: Database["public"]["Enums"]["content_status"];
  is_featured: boolean;
  display_order: number;
};

const BLANK: FormState = {
  title: "",
  slug: "",
  category_id: null,
  short_description: "",
  full_description: "",
  featured_image_url: null,
  patient_information: "",
  preparation_information: "",
  recovery_information: "",
  risks_disclaimer: "",
  seo_title: "",
  seo_description: "",
  status: "DRAFT",
  is_featured: false,
  display_order: 0,
};

function toFormState(p: ProcedureWithCategory): FormState {
  return {
    title: p.title,
    slug: p.slug,
    category_id: p.category_id,
    short_description: p.short_description ?? "",
    full_description: p.full_description ?? "",
    featured_image_url: p.featured_image_url,
    patient_information: p.patient_information ?? "",
    preparation_information: p.preparation_information ?? "",
    recovery_information: p.recovery_information ?? "",
    risks_disclaimer: p.risks_disclaimer ?? "",
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    status: p.status,
    is_featured: p.is_featured,
    display_order: p.display_order,
  };
}

type LoadedData = {
  categories: ProcedureCategory[];
  allFaqs: Faq[];
  procedure: ProcedureWithCategory | null;
  images: ProcedureImage[];
  linkedFaqIds: string[];
};

export function ProcedureForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";

  const { data, loading, error } = useSupabaseQuery<LoadedData>(async () => {
    const [categories, allFaqs, procedure, images, faqLinks] = await Promise.all([
      getProcedureCategories(),
      getAllFaqs(),
      isNew ? Promise.resolve({ data: null, error: null }) : getProcedureById(id!),
      isNew ? Promise.resolve({ data: [], error: null }) : getProcedureImages(id!),
      isNew ? Promise.resolve({ data: [], error: null }) : getProcedureFaqIds(id!),
    ]);

    if (!isNew && (procedure.error || !procedure.data)) {
      return { data: null, error: procedure.error ?? new Error("Procedure not found") };
    }

    return {
      data: {
        categories: categories.data ?? [],
        allFaqs: allFaqs.data ?? [],
        procedure: (procedure.data as ProcedureWithCategory | null) ?? null,
        images: images.data ?? [],
        linkedFaqIds: (faqLinks.data ?? []).map((l) => l.faq_id),
      } satisfies LoadedData,
      error: null,
    };
  }, [id]);

  return (
    <DataState loading={loading} error={error}>
      {data && <FormBody isNew={isNew} id={id} data={data} />}
    </DataState>
  );
}

function FormBody({
  isNew,
  id,
  data,
}: {
  isNew: boolean;
  id: string | undefined;
  data: LoadedData;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(data.procedure ? toFormState(data.procedure) : BLANK);
  const [images, setImages] = useState(data.images);
  const [linkedFaqIds, setLinkedFaqIds] = useState<string[]>(data.linkedFaqIds);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm(data.procedure ? toFormState(data.procedure) : BLANK);
    setImages(data.images);
    setLinkedFaqIds(data.linkedFaqIds);
  }, [data]);

  function field<K extends keyof FormState>(key: K) {
    return {
      value: form[key] as string,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  function handleTitleChange(e: ChangeEvent<HTMLInputElement>) {
    const title = e.target.value;
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      setSaveError("Title and slug are required.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    const values = {
      title: form.title,
      slug: form.slug,
      category_id: form.category_id,
      short_description: form.short_description || null,
      full_description: form.full_description || null,
      featured_image_url: form.featured_image_url,
      patient_information: form.patient_information || null,
      preparation_information: form.preparation_information || null,
      recovery_information: form.recovery_information || null,
      risks_disclaimer: form.risks_disclaimer || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      status: form.status,
      is_featured: form.is_featured,
      display_order: form.display_order,
    };

    const { data: saved, error } = isNew
      ? await createProcedure(values)
      : await updateProcedure(id!, values);

    if (error || !saved) {
      setSaving(false);
      setSaveError(error?.message ?? "Couldn't save this procedure.");
      return;
    }

    const [{ error: imagesError }, { error: faqsError }] = await Promise.all([
      replaceProcedureImages(
        saved.id,
        images
          .filter((img) => img.image_url.trim().length > 0)
          .map(({ image_url, caption, alt_text }) => ({ image_url, caption, alt_text }))
      ),
      setProcedureFaqs(saved.id, linkedFaqIds),
    ]);

    setSaving(false);

    if (imagesError || faqsError) {
      setSaveError("The procedure saved, but its images or FAQ links didn't. Please try saving again.");
      return;
    }

    toast.show("success", isNew ? "Procedure created." : "Procedure saved.");
    if (isNew) navigate(`/admin/procedures/${saved.id}`, { replace: true });
  }

  async function handleDelete() {
    if (!id) return;
    const { error } = await deleteProcedure(id);
    setConfirmDelete(false);
    if (error) {
      toast.show("error", "Couldn't delete this procedure.");
    } else {
      toast.show("success", "Procedure deleted.");
      navigate("/admin/procedures");
    }
  }

  return (
    <>
      <AdminFormShell
        title={isNew ? "New Procedure" : form.title || "Edit Procedure"}
        backTo="/admin/procedures"
        saving={saving}
        onSave={handleSave}
        onDelete={isNew ? undefined : () => setConfirmDelete(true)}
        error={saveError}
      >
        <FormSection title="Basics">
          <Field label="Title" value={form.title} onChange={handleTitleChange} />
          <Field
            label="Slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((f) => ({ ...f, slug: e.target.value }));
            }}
            hint="Used in the public URL: /procedures/<slug>"
          />
          <Select
            label="Category"
            value={form.category_id ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value || null }))}
          >
            <option value="">— None —</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Textarea label="Short description" rows={2} {...field("short_description")} />
          <ImageUploadField
            label="Featured image"
            bucket="public-assets"
            value={form.featured_image_url}
            onChange={(url) => setForm((f) => ({ ...f, featured_image_url: url }))}
          />
        </FormSection>

        <FormSection title="Details">
          <Textarea label="Full description" rows={5} {...field("full_description")} />
          <Textarea label="Patient information" rows={3} {...field("patient_information")} />
          <Textarea label="Preparing for the procedure" rows={3} {...field("preparation_information")} />
          <Textarea label="Recovery" rows={3} {...field("recovery_information")} />
          <Textarea label="Risks & disclaimer" rows={3} {...field("risks_disclaimer")} />
        </FormSection>

        <FormSection title="Gallery Images">
          <RepeatableList
            items={images}
            onChange={setImages}
            addLabel="Add image"
            newItem={() => ({
              id: crypto.randomUUID(),
              procedure_id: id ?? "",
              image_url: "",
              caption: null,
              alt_text: null,
              display_order: images.length,
              created_at: new Date().toISOString(),
            })}
            renderItem={(img, update) => (
              <div className="space-y-2">
                <ImageUploadField
                  label="Image"
                  bucket="public-assets"
                  value={img.image_url || null}
                  onChange={(url) => update({ image_url: url ?? "" })}
                />
                <Field
                  label="Caption"
                  value={img.caption ?? ""}
                  onChange={(e) => update({ caption: e.target.value || null })}
                />
              </div>
            )}
          />
        </FormSection>

        <FormSection title="Related FAQs">
          {data.allFaqs.length === 0 ? (
            <p className="text-sm text-muted">No FAQs exist yet — add some under FAQs first.</p>
          ) : (
            <div className="space-y-2">
              {data.allFaqs.map((faq) => (
                <label key={faq.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={linkedFaqIds.includes(faq.id)}
                    onChange={(e) =>
                      setLinkedFaqIds((ids) =>
                        e.target.checked ? [...ids, faq.id] : ids.filter((i) => i !== faq.id)
                      )
                    }
                  />
                  <span className={faq.published ? "text-ink" : "text-muted"}>
                    {faq.question} {!faq.published && "(unpublished)"}
                  </span>
                </label>
              ))}
            </div>
          )}
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
            description="Shown on the homepage's featured procedures section."
            checked={form.is_featured}
            onChange={(checked) => setForm((f) => ({ ...f, is_featured: checked }))}
          />
          <Field
            label="Display order"
            type="number"
            value={form.display_order}
            onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
          />
        </FormSection>

        <FormSection title="SEO">
          <Field label="SEO title" {...field("seo_title")} />
          <Textarea label="SEO description" rows={2} {...field("seo_description")} />
        </FormSection>
      </AdminFormShell>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this procedure?"
        description={`"${form.title}" will be permanently removed, along with its images and FAQ links. This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
