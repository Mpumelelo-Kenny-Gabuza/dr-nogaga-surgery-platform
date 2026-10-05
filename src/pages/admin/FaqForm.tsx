import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminFormShell, FormSection } from "@/components/admin/AdminFormShell";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { DataState } from "@/components/public/DataState";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getFaqById } from "@/lib/supabase/adminQueries";
import { createFaq, deleteFaq, updateFaq } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import type { Faq } from "@/types/content";

type FormState = { question: string; answer: string; category: string; published: boolean };

const BLANK: FormState = { question: "", answer: "", category: "", published: false };

function toFormState(f: Faq): FormState {
  return { question: f.question, answer: f.answer, category: f.category ?? "", published: f.published };
}

export function FaqForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading, error } = useSupabaseQuery<Faq | null>(
    async () => (isNew ? { data: null, error: null } : await getFaqById(id!)),
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
    if (!form.question.trim() || !form.answer.trim()) {
      setSaveError("Question and answer are required.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    const values = {
      question: form.question,
      answer: form.answer,
      category: form.category || null,
      published: form.published,
    };

    const { data: saved, error } = isNew ? await createFaq(values) : await updateFaq(id!, values);
    setSaving(false);

    if (error || !saved) {
      setSaveError(error?.message ?? "Couldn't save this FAQ.");
      return;
    }

    toast.show("success", isNew ? "FAQ added." : "FAQ saved.");
    if (isNew) navigate(`/admin/faqs/${saved.id}`, { replace: true });
  }

  async function handleDelete() {
    if (!id) return;
    const { error } = await deleteFaq(id);
    setConfirmDelete(false);
    if (error) {
      toast.show("error", "Couldn't delete this FAQ.");
    } else {
      toast.show("success", "FAQ deleted.");
      navigate("/admin/faqs");
    }
  }

  return (
    <DataState loading={loading} error={error}>
      <AdminFormShell
        title={isNew ? "Add FAQ" : "Edit FAQ"}
        backTo="/admin/faqs"
        saving={saving}
        onSave={handleSave}
        onDelete={isNew ? undefined : () => setConfirmDelete(true)}
        error={saveError}
      >
        <FormSection>
          <Field label="Question" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
          <Textarea
            label="Answer"
            rows={4}
            value={form.answer}
            onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
          />
          <Field
            label="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            hint="Optional — groups FAQs on the public FAQ page."
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
        title="Delete this FAQ?"
        description="This will also remove it from any procedure pages it's linked to. This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </DataState>
  );
}
