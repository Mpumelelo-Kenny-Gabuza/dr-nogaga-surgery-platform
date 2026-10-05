import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { DataState } from "@/components/public/DataState";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAllPosts } from "@/lib/supabase/adminQueries";
import { deletePost } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import { formatDate } from "@/lib/format";
import type { PostWithRelations } from "@/types/content";

export function ResourcesList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refetch } = useSupabaseQuery<PostWithRelations[]>(
    async () => {
      const { data, error } = await getAllPosts();
      return { data: (data ?? []) as PostWithRelations[], error };
    },
    []
  );
  const [pendingDelete, setPendingDelete] = useState<PostWithRelations | null>(null);

  async function handleDelete() {
    if (!pendingDelete) return;
    const { error } = await deletePost(pendingDelete.id);
    setPendingDelete(null);
    if (error) {
      toast.show("error", "Couldn't delete that article.");
    } else {
      toast.show("success", "Article deleted.");
      refetch();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">Patient Resources</h1>
          <p className="mt-1 text-sm text-muted">Blog posts and educational articles.</p>
        </div>
        <button
          onClick={() => navigate("/admin/resources/new")}
          className="inline-flex items-center gap-1.5 rounded-[3px] bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dark"
        >
          <Plus size={15} /> New Article
        </button>
      </div>

      <div className="mt-8">
        <DataState loading={loading} error={error}>
          {data && (
            <AdminDataTable
              rows={data}
              keyFor={(row) => row.id}
              emptyMessage="No articles yet — write the first one."
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
                { header: "Category", render: (row) => row.post_categories?.name ?? "—" },
                { header: "Author", render: (row) => row.profiles?.full_name ?? "—" },
                { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                { header: "Updated", render: (row) => formatDate(row.updated_at) ?? "—" },
              ]}
              renderActions={(row) => (
                <>
                  <Link to={`/admin/resources/${row.id}`} className="text-sm font-medium text-teal hover:underline">
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
        title="Delete this article?"
        description={`"${pendingDelete?.title}" will be permanently removed. This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
