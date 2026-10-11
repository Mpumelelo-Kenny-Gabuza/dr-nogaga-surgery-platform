import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { DataState } from "@/components/public/DataState";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { CommentStatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAllComments } from "@/lib/supabase/adminQueries";
import { deleteComment, postPracticeReply, updateCommentStatus } from "@/lib/supabase/mutations";
import { useToast } from "@/features/toast/useToast";
import { formatDate } from "@/lib/format";
import type { CommentWithPost } from "@/types/content";
import type { Database } from "@/types/database.types";

type CommentStatus = Database["public"]["Enums"]["comment_status"];

const STATUS_FILTERS: { value: CommentStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "HIDDEN", label: "Hidden" },
];

const STATUS_OPTIONS: CommentStatus[] = ["PENDING", "APPROVED", "REJECTED", "HIDDEN"];

export function CommentsList() {
  const { data, loading, error, refetch } = useSupabaseQuery<CommentWithPost[]>(async () => {
    const { data, error } = await getAllComments();
    return { data: (data as CommentWithPost[] | null) ?? [], error };
  }, []);

  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<CommentStatus | "ALL">("ALL");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommentWithPost | null>(null);

  const byId = useMemo(() => new Map((data ?? []).map((c) => [c.id, c])), [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return statusFilter === "ALL" ? data : data.filter((row) => row.status === statusFilter);
  }, [data, statusFilter]);

  const pendingCount = data?.filter((row) => row.status === "PENDING").length ?? 0;

  function setRowSaving(id: string, saving: boolean) {
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (saving) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleStatusChange(row: CommentWithPost, status: CommentStatus) {
    if (status === row.status) return;
    setRowSaving(row.id, true);
    const { error } = await updateCommentStatus(row.id, status);
    setRowSaving(row.id, false);
    toast.show(error ? "error" : "success", error ? "Couldn't update that comment." : "Comment updated.");
    if (!error) refetch();
  }

  async function handleReplySubmit(row: CommentWithPost) {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setReplySaving(true);
    const { error } = await postPracticeReply(row.post_id, row.id, trimmed);
    setReplySaving(false);
    if (error) {
      toast.show("error", "Couldn't post the reply.");
      return;
    }
    setReplyText("");
    setReplyOpenId(null);
    toast.show("success", "Reply posted — it's live on the article now.");
    refetch();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await deleteComment(deleteTarget.id);
    setDeleteTarget(null);
    toast.show(error ? "error" : "success", error ? "Couldn't delete that comment." : "Comment deleted.");
    if (!error) refetch();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">Comments</h1>
          <p className="mt-1 text-sm text-muted">
            Moderation queue for every comment submitted on Patient Resources articles.
            {data && pendingCount > 0 && (
              <span className="ml-1 font-medium text-teal-dark">
                {pendingCount} awaiting moderation.
              </span>
            )}
          </p>
        </div>
        <div className="w-56">
          <Select
            label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CommentStatus | "ALL")}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-8">
        <DataState loading={loading} error={error}>
          {data && (
            <AdminDataTable
              rows={filtered}
              keyFor={(row) => row.id}
              emptyMessage={
                statusFilter === "ALL" ? "No comments yet." : "No comments match this filter."
              }
              columns={[
                {
                  header: "Post",
                  render: (row) =>
                    row.posts ? (
                      <Link
                        to={`/admin/resources/${row.posts.id}`}
                        className="font-medium text-teal hover:underline"
                      >
                        {row.posts.title}
                      </Link>
                    ) : (
                      "—"
                    ),
                },
                {
                  header: "Comment",
                  className: "max-w-md",
                  render: (row) => (
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-ink">{row.name}</span>
                        {row.is_practice_reply && (
                          <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-dark">
                            Official reply
                          </span>
                        )}
                      </div>
                      {row.parent_comment_id && (
                        <p className="mt-0.5 text-xs text-muted">
                          ↳ reply to {byId.get(row.parent_comment_id)?.name ?? "a deleted comment"}
                        </p>
                      )}
                      {row.email && <p className="mt-0.5 text-xs text-muted">{row.email}</p>}
                      <p className="mt-1.5 whitespace-pre-wrap text-ink-light">{row.content}</p>

                      {replyOpenId === row.id ? (
                        <div className="mt-3 space-y-2 border-t border-line pt-3">
                          <Textarea
                            label="Reply as the practice"
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Thank you for reaching out..."
                          />
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyOpenId(null);
                                setReplyText("");
                              }}
                              className="text-sm text-muted hover:text-ink"
                            >
                              Cancel
                            </button>
                            <Button
                              type="button"
                              onClick={() => handleReplySubmit(row)}
                              disabled={replySaving || !replyText.trim()}
                            >
                              {replySaving && <Loader2 size={14} className="animate-spin" />}
                              Post Reply
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyOpenId(row.id);
                            setReplyText("");
                          }}
                          className="mt-2 text-xs font-medium text-teal hover:underline"
                        >
                          Reply as the practice
                        </button>
                      )}
                    </div>
                  ),
                },
                {
                  header: "Status",
                  render: (row) => (
                    <div className="w-40">
                      <Select
                        label=""
                        aria-label="Change status"
                        value={row.status}
                        disabled={savingIds.has(row.id)}
                        onChange={(e) => handleStatusChange(row, e.target.value as CommentStatus)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                      <div className="mt-1">
                        <CommentStatusBadge status={row.status} />
                      </div>
                    </div>
                  ),
                },
                { header: "Submitted", render: (row) => formatDate(row.created_at) },
              ]}
              renderActions={(row) => (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-red-600"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            />
          )}
        </DataState>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this comment?"
        description="This permanently removes the comment (and, if others replied to it, orphans those replies rather than deleting them too). This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
