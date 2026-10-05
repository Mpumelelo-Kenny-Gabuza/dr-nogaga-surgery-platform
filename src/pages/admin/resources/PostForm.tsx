import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminFormShell, FormSection } from "@/components/admin/AdminFormShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { DataState } from "@/components/public/DataState";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getPostById, getPostCategories, getPostTagNames } from "@/lib/supabase/adminQueries";
import { createPost, deletePost, setPostTags, updatePost } from "@/lib/supabase/mutations";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/features/toast/useToast";
import { slugify } from "@/lib/slug";
import type { Database } from "@/types/database.types";
import type { PostCategory, PostWithRelations } from "@/types/content";

type FormState = {
  title: string;
  slug: string;
  category_id: string | null;
  excerpt: string;
  content_html: string;
  featured_image_url: string | null;
  reading_time_minutes: string;
  status: Database["public"]["Enums"]["content_status"];
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
};

const BLANK: FormState = {
  title: "",
  slug: "",
  category_id: null,
  excerpt: "",
  content_html: "",
  featured_image_url: null,
  reading_time_minutes: "",
  status: "DRAFT",
  is_featured: false,
  seo_title: "",
  seo_description: "",
};

function toFormState(p: PostWithRelations): FormState {
  return {
    title: p.title,
    slug: p.slug,
    category_id: p.category_id,
    excerpt: p.excerpt ?? "",
    content_html: p.content_html ?? "",
    featured_image_url: p.featured_image_url,
    reading_time_minutes: p.reading_time_minutes?.toString() ?? "",
    status: p.status,
    is_featured: p.is_featured,
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
  };
}

type LoadedData = {
  categories: PostCategory[];
  post: PostWithRelations | null;
  tagNames: string[];
};

export function PostForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";

  const { data, loading, error } = useSupabaseQuery<LoadedData>(async () => {
    const [categories, post, tagLinks] = await Promise.all([
      getPostCategories(),
      isNew ? Promise.resolve({ data: null, error: null }) : getPostById(id!),
      isNew ? Promise.resolve({ data: [], error: null }) : getPostTagNames(id!),
    ]);

    if (!isNew && (post.error || !post.data)) {
      return { data: null, error: post.error ?? new Error("Article not found") };
    }

    const tagNames = (tagLinks.data ?? [])
      .map((l) => l.post_tags?.name)
      .filter((n): n is string => Boolean(n));

    return {
      data: {
        categories: categories.data ?? [],
        post: (post.data as PostWithRelations | null) ?? null,
        tagNames,
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

function FormBody({ isNew, id, data }: { isNew: boolean; id: string | undefined; data: LoadedData }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(data.post ? toFormState(data.post) : BLANK);
  const [tagsInput, setTagsInput] = useState(data.tagNames.join(", "));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm(data.post ? toFormState(data.post) : BLANK);
    setTagsInput(data.tagNames.join(", "));
  }, [data]);

  function field<K extends keyof FormState>(key: K) {
    return {
      value: form[key] as string,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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

    const wasPublished = data.post?.status === "PUBLISHED";
    const nowPublishing = form.status === "PUBLISHED" && !wasPublished;

    const values = {
      title: form.title,
      slug: form.slug,
      category_id: form.category_id,
      excerpt: form.excerpt || null,
      content_html: form.content_html || null,
      featured_image_url: form.featured_image_url,
      reading_time_minutes: form.reading_time_minutes ? Number(form.reading_time_minutes) : null,
      status: form.status,
      is_featured: form.is_featured,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      ...(nowPublishing ? { published_at: new Date().toISOString() } : {}),
    };

    let saved;
    let error;
    if (isNew) {
      const { data: userData } = await supabase.auth.getUser();
      ({ data: saved, error } = await createPost({ ...values, author_id: userData.user?.id ?? null }));
    } else {
      ({ data: saved, error } = await updatePost(id!, values));
    }

    if (error || !saved) {
      setSaving(false);
      setSaveError(error?.message ?? "Couldn't save this article.");
      return;
    }

    const tagNames = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const { error: tagsError } = await setPostTags(saved.id, tagNames);

    setSaving(false);

    if (tagsError) {
      setSaveError("The article saved, but its tags didn't. Please try saving again.");
      return;
    }

    toast.show("success", isNew ? "Article created." : "Article saved.");
    if (isNew) navigate(`/admin/resources/${saved.id}`, { replace: true });
  }

  async function handleDelete() {
    if (!id) return;
    const { error } = await deletePost(id);
    setConfirmDelete(false);
    if (error) {
      toast.show("error", "Couldn't delete this article.");
    } else {
      toast.show("success", "Article deleted.");
      navigate("/admin/resources");
    }
  }

  return (
    <>
      <AdminFormShell
        title={isNew ? "New Article" : form.title || "Edit Article"}
        backTo="/admin/resources"
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
            hint="Used in the public URL: /resources/<slug>"
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
          <Field
            label="Tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            hint="Comma-separated — new tags are created automatically."
          />
          <Textarea label="Excerpt" rows={2} {...field("excerpt")} />
          <ImageUploadField
            label="Featured image"
            bucket="blog-images"
            value={form.featured_image_url}
            onChange={(url) => setForm((f) => ({ ...f, featured_image_url: url }))}
          />
          <Field
            label="Reading time (minutes)"
            type="number"
            {...field("reading_time_minutes")}
          />
        </FormSection>

        <FormSection title="Content">
          <RichTextEditor
            value={form.content_html}
            onChange={(html) => setForm((f) => ({ ...f, content_html: html }))}
          />
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
            description="Shown first on the Patient Resources page."
            checked={form.is_featured}
            onChange={(checked) => setForm((f) => ({ ...f, is_featured: checked }))}
          />
        </FormSection>

        <FormSection title="SEO">
          <Field label="SEO title" {...field("seo_title")} />
          <Textarea label="SEO description" rows={2} {...field("seo_description")} />
        </FormSection>
      </AdminFormShell>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this article?"
        description={`"${form.title}" will be permanently removed. This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
