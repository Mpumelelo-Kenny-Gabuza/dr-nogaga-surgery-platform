import { type FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/features/toast/useToast";
import { submitComment } from "@/lib/supabase/engagement";
import { formatDate } from "@/lib/format";
import type { Comment, CommentWithReplies } from "@/types/content";

type ReplyTarget = { id: string; name: string };

/**
 * `comments` is the already-APPROVED, already-sorted-ascending flat list
 * from ArticleDetail's loader (getApprovedComments) — this component only
 * ever renders what's actually public. A just-submitted comment never
 * appears in it (it's PENDING, not APPROVED — see engagement.ts's
 * submitComment comment for why), so the form shows its own "awaiting
 * moderation" confirmation instead of trying to optimistically insert into
 * the thread.
 */
export function CommentSection({ postId, comments }: { postId: string; comments: Comment[] }) {
  const threads = useMemo(() => groupThread(comments), [comments]);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);

  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="text-xl text-ink">
        Comments{comments.length > 0 && <span className="text-muted"> ({comments.length})</span>}
      </h2>

      {threads.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No comments yet — be the first to share your thoughts.</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {threads.map((thread) => (
            <li key={thread.id}>
              <CommentItem comment={thread} onReply={setReplyTarget} />
              {thread.replies.length > 0 && (
                <ul className="mt-4 space-y-4">
                  {thread.replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentItem comment={reply} isReply onReply={setReplyTarget} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        <CommentForm
          postId={postId}
          parent={replyTarget}
          onCancelReply={() => setReplyTarget(null)}
          onSubmitted={() => setReplyTarget(null)}
        />
      </div>
    </section>
  );
}

/**
 * Groups every reply under its ultimate top-level ancestor and renders it
 * one visual level deep, however many parent_comment_id hops it actually
 * took to get there — a reply-to-a-reply still reads as part of the same
 * conversation rather than an ever-indenting staircase. A reply whose
 * parent isn't in this (APPROVED-only) list — e.g. it replied to a comment
 * that's since been hidden — safely falls back to rendering as its own
 * top-level thread instead of being dropped.
 */
function groupThread(comments: Comment[]): CommentWithReplies[] {
  const byId = new Map(comments.map((c) => [c.id, c]));

  function topLevelAncestorId(comment: Comment): string {
    let current = comment;
    const visited = new Set<string>();
    while (current.parent_comment_id && byId.has(current.parent_comment_id) && !visited.has(current.id)) {
      visited.add(current.id);
      current = byId.get(current.parent_comment_id)!;
    }
    return current.id;
  }

  const repliesByTopLevelId = new Map<string, Comment[]>();
  for (const comment of comments) {
    if (comment.parent_comment_id === null) continue;
    const topId = topLevelAncestorId(comment);
    if (topId === comment.id) continue; // orphaned reply — it already stands as its own top-level thread below
    if (!repliesByTopLevelId.has(topId)) repliesByTopLevelId.set(topId, []);
    repliesByTopLevelId.get(topId)!.push(comment);
  }

  return comments
    .filter((c) => c.parent_comment_id === null || topLevelAncestorId(c) === c.id)
    .map((top) => ({ ...top, replies: repliesByTopLevelId.get(top.id) ?? [] }));
}

function CommentItem({
  comment,
  isReply = false,
  onReply,
}: {
  comment: Comment;
  isReply?: boolean;
  onReply: (target: ReplyTarget) => void;
}) {
  return (
    <div
      className={clsx(
        "rounded-sm p-4",
        isReply && "ml-6 border-l-2 border-line pl-4 sm:ml-10",
        comment.is_practice_reply ? "border border-teal/30 bg-teal/5" : "border border-line bg-white"
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-ink">{comment.name}</span>
        {comment.is_practice_reply && (
          <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-dark">
            Official Reply
          </span>
        )}
        <span className="text-xs text-muted">&middot; {formatDate(comment.created_at)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-ink-light">{comment.content}</p>
      <button
        type="button"
        onClick={() => onReply({ id: comment.id, name: comment.name })}
        className="mt-2 text-xs font-medium text-teal hover:underline"
      >
        Reply
      </button>
    </div>
  );
}

function CommentForm({
  postId,
  parent,
  onCancelReply,
  onSubmitted,
}: {
  postId: string;
  parent: ReplyTarget | null;
  onCancelReply: () => void;
  onSubmitted: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedContent = content.trim();
    if (!trimmedName || !trimmedContent) return;

    setSubmitting(true);
    const { error } = await submitComment({
      postId,
      parentCommentId: parent?.id ?? null,
      name: trimmedName,
      email: email.trim() || null,
      content: trimmedContent,
    });
    setSubmitting(false);

    if (error) {
      toast.show("error", "Couldn't submit your comment — please try again.");
      return;
    }

    setContent("");
    setSubmitted(true);
    onSubmitted();
  }

  if (submitted) {
    return (
      <div className="rounded-sm border border-teal/30 bg-teal/5 p-4 text-sm text-teal-dark">
        Thanks — your comment has been submitted and will appear once it's been reviewed.{" "}
        <button type="button" onClick={() => setSubmitted(false)} className="font-medium underline">
          Leave another comment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-medium text-ink">{parent ? "Write a reply" : "Leave a comment"}</h3>

      {parent && (
        <div className="flex items-center justify-between rounded-sm bg-cream px-3 py-2 text-sm text-ink-light">
          <span>
            Replying to <span className="font-medium text-ink">{parent.name}</span>
          </span>
          <button type="button" onClick={onCancelReply} className="text-xs text-muted hover:text-ink">
            Cancel
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Field
          label="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hint="Never shown publicly — for the practice's own reference only."
        />
      </div>

      <Textarea
        label="Comment"
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || !name.trim() || !content.trim()}>
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {parent ? "Post Reply" : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
