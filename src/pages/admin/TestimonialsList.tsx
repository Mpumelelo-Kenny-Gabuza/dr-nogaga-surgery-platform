import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { DataState } from "@/components/public/DataState";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAllTestimonials } from "@/lib/supabase/adminQueries";
import { deleteTestimonial } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import type { TestimonialWithProcedure } from "@/types/content";

export function TestimonialsList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refetch } = useSupabaseQuery<TestimonialWithProcedure[]>(
    async () => {
      const { data, error } = await getAllTestimonials();
      return { data: (data ?? []) as TestimonialWithProcedure[], error };
    },
    []
  );
  const [pendingDelete, setPendingDelete] = useState<TestimonialWithProcedure | null>(null);

  async function handleDelete() {
    if (!pendingDelete) return;
    const { error } = await deleteTestimonial(pendingDelete.id);
    setPendingDelete(null);
    if (error) {
      toast.show("error", "Couldn't delete that testimonial.");
    } else {
      toast.show("success", "Testimonial deleted.");
      refetch();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">Testimonials</h1>
          <p className="mt-1 text-sm text-muted">Patient feedback shown on the public site.</p>
        </div>
        <button
          onClick={() => navigate("/admin/testimonials/new")}
          className="inline-flex items-center gap-1.5 rounded-[3px] bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dark"
        >
          <Plus size={15} /> Add Testimonial
        </button>
      </div>

      <div className="mt-8">
        <DataState loading={loading} error={error}>
          {data && (
            <AdminDataTable
              rows={data}
              keyFor={(row) => row.id}
              emptyMessage="No testimonials yet — add the first one."
              columns={[
                {
                  header: "Patient",
                  render: (row) => (
                    <span className="flex items-center gap-1.5 font-medium text-ink">
                      {row.is_featured && <Star size={13} className="fill-teal text-teal" />}
                      {row.display_name}
                    </span>
                  ),
                },
                { header: "Procedure", render: (row) => row.procedures?.title ?? "—" },
                { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
              ]}
              renderActions={(row) => (
                <>
                  <Link to={`/admin/testimonials/${row.id}`} className="text-sm font-medium text-teal hover:underline">
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
        title="Delete this testimonial?"
        description={`The testimonial from "${pendingDelete?.display_name}" will be permanently removed. This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
