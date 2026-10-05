import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus } from "lucide-react";
import { DataState } from "@/components/public/DataState";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { PublishedBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAllFaqs } from "@/lib/supabase/adminQueries";
import { deleteFaq } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import type { Faq } from "@/types/content";

export function FaqsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refetch } = useSupabaseQuery<Faq[]>(
    async () => {
      const { data, error } = await getAllFaqs();
      return { data: data ?? [], error };
    },
    []
  );
  const [pendingDelete, setPendingDelete] = useState<Faq | null>(null);

  async function handleDelete() {
    if (!pendingDelete) return;
    const { error } = await deleteFaq(pendingDelete.id);
    setPendingDelete(null);
    if (error) {
      toast.show("error", "Couldn't delete that FAQ.");
    } else {
      toast.show("success", "FAQ deleted.");
      refetch();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">FAQs</h1>
          <p className="mt-1 text-sm text-muted">Frequently asked questions shown on the public site.</p>
        </div>
        <button
          onClick={() => navigate("/admin/faqs/new")}
          className="inline-flex items-center gap-1.5 rounded-[3px] bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dark"
        >
          <Plus size={15} /> Add FAQ
        </button>
      </div>

      <div className="mt-8">
        <DataState loading={loading} error={error}>
          {data && (
            <AdminDataTable
              rows={data}
              keyFor={(row) => row.id}
              emptyMessage="No FAQs yet — add the first one."
              columns={[
                { header: "Question", render: (row) => <span className="font-medium text-ink">{row.question}</span> },
                { header: "Category", render: (row) => row.category ?? "—" },
                { header: "Status", render: (row) => <PublishedBadge published={row.published} /> },
              ]}
              renderActions={(row) => (
                <>
                  <Link to={`/admin/faqs/${row.id}`} className="text-sm font-medium text-teal hover:underline">
                    Edit
                  </Link>
                  <button
                    onClick={() => setPendingDelete(row)}
                    className="text-sm font-medium text-muted hover:text-red-600"
                  >
                    Delete
                  </button>
                </>
              )}
            />
          )}
        </DataState>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this FAQ?"
        description="This will also remove it from any procedure pages it's linked to. This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
