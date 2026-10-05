import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Shared page chrome for every admin create/edit form: back link, title, save/delete actions. */
export function AdminFormShell({
  title,
  backTo,
  saving,
  onSave,
  onDelete,
  error,
  children,
}: {
  title: string;
  backTo: string;
  saving: boolean;
  onSave: () => void;
  onDelete?: () => void;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl text-ink">{title}</h1>
        <div className="flex items-center gap-3">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-red-600"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 max-w-3xl space-y-8">{children}</div>
    </div>
  );
}

/** Groups related fields within a form, matching the admin's section rhythm. */
export function FormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-sm border border-line bg-white p-6">
      {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-teal">{title}</h2>}
      {children}
    </div>
  );
}
