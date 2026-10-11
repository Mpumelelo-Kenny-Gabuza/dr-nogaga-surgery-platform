// ============================================================================
// Phase 7 — the public blog's only way to write to the database: liking a
// post and submitting a comment. Separate from mutations.ts on purpose,
// same reasoning as the public consultation form's enquiry.ts: that file is
// specifically the admin CMS's write path (every call logs to audit_logs
// and assumes a staff session), and these two actions are neither.
// ============================================================================
import { supabase } from "@/lib/supabase/client";

const ANON_KEY_STORAGE_KEY = "blog:anon-like-key";

/**
 * A random per-browser key for an anonymous like, generated once and kept
 * in localStorage — the client-supplied identity the post_likes schema
 * comment already documents as a known, accepted tradeoff (stops a casual
 * double-click, not a determined visitor resetting it). Never used for
 * anything access-control-sensitive.
 */
export function getAnonLikeKey(): string {
  try {
    const existing = localStorage.getItem(ANON_KEY_STORAGE_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(ANON_KEY_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // Private-browsing/storage-blocked: fall back to a key that lives only
    // for this call. The like still succeeds; it just won't be remembered
    // as "already liked" on the next page load, which is a quiet
    // degradation, not a broken feature.
    return crypto.randomUUID();
  }
}

/** identity is the signed-in staff member's own id when one exists (e.g. browsing the live site logged into /admin elsewhere), otherwise the anon key above — mirrors getViewerLike's shape in queries.ts. */
export function likePost(postId: string, identity: { userId: string } | { anonKey: string }) {
  return supabase
    .from("post_likes")
    .insert(
      "userId" in identity
        ? { post_id: postId, user_id: identity.userId }
        : { post_id: postId, anon_key: identity.anonKey }
    )
    .select("id")
    .single();
}

export function unlikePost(likeId: string) {
  return supabase.from("post_likes").delete().eq("id", likeId);
}

export type SubmitCommentInput = {
  postId: string;
  parentCommentId: string | null;
  name: string;
  email: string | null;
  content: string;
};

/**
 * Always inserts as PENDING, never practice-reply — "the public may submit
 * a pending comment" (migration 20260930090800) is the only insert path
 * this ever uses. A staff reply is a deliberately separate, admin-only
 * action (postPracticeReply in mutations.ts) rather than this same
 * function branching on who's signed in, so there's exactly one way a
 * comment can land on the moderation queue and exactly one way it can
 * bypass it.
 *
 * Deliberately no `.select()` here. A PENDING row isn't visible under
 * "approved comments are publicly readable" (status = 'APPROVED' or
 * is_staff()), so an anon submitter chaining .select() would hit the exact
 * same RETURNING-visibility wall documented at length in enquiry.ts/the
 * Phase 5 audit.ts comment — Postgres re-checks an INSERT's RETURNING
 * against the table's SELECT policy, which a fresh PENDING comment always
 * fails for a non-staff caller. The form doesn't need the row back; it
 * just needs to know the insert succeeded.
 */
export function submitComment(input: SubmitCommentInput) {
  return supabase.from("comments").insert({
    post_id: input.postId,
    parent_comment_id: input.parentCommentId,
    name: input.name,
    email: input.email,
    content: input.content,
    status: "PENDING",
    is_practice_reply: false,
  });
}
