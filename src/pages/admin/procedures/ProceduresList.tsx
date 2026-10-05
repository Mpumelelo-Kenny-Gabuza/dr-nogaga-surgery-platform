import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { DataState } from "@/components/public/DataState";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAllProcedures } from "@/lib/supabase/adminQueries";
import { deleteProcedure } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import { formatDate } from "@/lib/format";
import type { ProcedureWithCategory } from "@/types/content";

export function ProceduresList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refetch } = useSupabaseQuery<ProcedureWithCategory[]>(
    async () => {
      const { data, error } = await getAllProcedures();
      return { data: (data ?? []) as ProcedureWithCategory[], error };
    },
    []
  );
  const [pendingDelete, setPendingDelete] = useState<ProcedureWithCategory | null>(null);

  async function handleDelete() {
    if (!pendingDelete) return;
    const { error } = await deleteProcedure(pendingDelete.id);
    setPendingDelete(null);
    if (error) {
      toast.show("error", "Couldn't delete that procedure.");
    } else {
      toast.show("success", "Procedure deleted.");
      refetch();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">Procedures</h1>
          <p className="mt-1 text-sm text-muted">Manage the services shown on the public site.</p>
        </div>
        <button
          onClick={() => navigate("/admin/procedures/new")}
          className="inline-flex items-center gap-1.5 rounded-[3px] bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dark"
        >
          <Plus size={15} /> New Procedure
        </button>
      </div>

      <div className="mt-8">
        <DataState loading={loading} error={error}>
          {data && (
            <AdminDataTable
              rows={data}
              keyFor={(row) => row.id}
              emptyMessage="No procedures yet — create the first one."
              columns={[
                {
                  header: "Title",
                  render: (row) => (
                    <span className="flex items-center gap-1.5 font-medium text-ink">
                      {row.is_featured && <Star size={13} className="fill-teal text-teal" />}
                      {row.title}
                    </span>
                  ),
                },
                { header: "Category", render: (row) => row.procedure_categories?.name ?? "—" },
                { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                { header: "Updated", render: (row) => formatDate(row.updated_at) ?? "—" },
              ]}
              renderActions={(row) => (
                <>
                  <Link to={`/admin/procedures/${row.id}`} className="text-sm font-medium text-teal hover:underline">
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
        title="Delete this procedure?"
        description={`"${pendingDelete?.title}" will be permanently removed, along with its images and FAQ links. This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
