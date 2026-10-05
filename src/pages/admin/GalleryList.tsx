import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus } from "lucide-react";
import { DataState } from "@/components/public/DataState";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { PublishedBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAllGalleryItems } from "@/lib/supabase/adminQueries";
import { deleteGalleryItem } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import type { GalleryItem } from "@/types/content";

export function GalleryList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refetch } = useSupabaseQuery<GalleryItem[]>(
    async () => {
      const { data, error } = await getAllGalleryItems();
      return { data: data ?? [], error };
    },
    []
  );
  const [pendingDelete, setPendingDelete] = useState<GalleryItem | null>(null);

  async function handleDelete() {
    if (!pendingDelete) return;
    const { error } = await deleteGalleryItem(pendingDelete.id);
    setPendingDelete(null);
    if (error) {
      toast.show("error", "Couldn't delete that image.");
    } else {
      toast.show("success", "Image deleted.");
      refetch();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">Gallery</h1>
          <p className="mt-1 text-sm text-muted">Photos shown on the public Gallery page.</p>
        </div>
        <button
          onClick={() => navigate("/admin/gallery/new")}
          className="inline-flex items-center gap-1.5 rounded-[3px] bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dark"
        >
          <Plus size={15} /> Add Image
        </button>
      </div>

      <div className="mt-8">
        <DataState loading={loading} error={error}>
          {data && (
            <AdminDataTable
              rows={data}
              keyFor={(row) => row.id}
              emptyMessage="No images yet — add the first one."
              columns={[
                {
                  header: "Image",
                  render: (row) => (
                    <img src={row.image_url} alt="" className="h-12 w-16 rounded-sm object-cover" />
                  ),
                },
                { header: "Caption", render: (row) => row.caption ?? "—" },
                { header: "Category", render: (row) => row.category ?? "—" },
                { header: "Status", render: (row) => <PublishedBadge published={row.published} /> },
              ]}
              renderActions={(row) => (
                <>
                  <Link to={`/admin/gallery/${row.id}`} className="text-sm font-medium text-teal hover:underline">
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
        title="Delete this image?"
        description="This image will be permanently removed from the gallery. This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
