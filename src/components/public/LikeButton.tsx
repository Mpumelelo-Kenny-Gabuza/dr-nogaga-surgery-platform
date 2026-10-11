import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/features/auth/useAuth";
import { getPostLikeCount, getViewerLike } from "@/lib/supabase/queries";
import { getAnonLikeKey, likePost, unlikePost } from "@/lib/supabase/engagement";

/**
 * Self-contained, like WhatsAppButton — loads its own count + "has this
 * viewer already liked it" state on mount rather than piggy-backing on
 * ArticleDetail's loadArticle, so it works wherever a post card wants one.
 *
 * Identity: a signed-in staff member browsing the live site (their session
 * is global, not admin-scoped — see AuthProvider) likes as their own
 * profile id; everyone else gets the localStorage anon key from
 * engagement.ts. Matches the user_id-xor-anon_key shape the "anyone may
 * like a post" RLS policy requires (migration 20260930090800).
 */
export function LikeButton({ postId }: { postId: string }) {
  const { profile } = useAuth();
  const identity = profile ? { userId: profile.id } : { anonKey: getAnonLikeKey() };

  const [count, setCount] = useState<number | null>(null);
  const [likeId, setLikeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ count: total }, { data: existing }] = await Promise.all([
        getPostLikeCount(postId),
        getViewerLike(postId, identity),
      ]);
      if (cancelled) return;
      setCount(total ?? 0);
      setLikeId(existing?.id ?? null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // Re-derives identity itself when profile?.id changes (sign-in/out
    // mid-visit); postId covers navigating between articles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, profile?.id]);

  async function toggle() {
    if (pending || loading) return;
    setPending(true);

    if (likeId) {
      const { error } = await unlikePost(likeId);
      if (!error) {
        setLikeId(null);
        setCount((c) => Math.max(0, (c ?? 1) - 1));
      }
    } else {
      const { data, error } = await likePost(postId, identity);
      if (!error && data) {
        setLikeId(data.id);
        setCount((c) => (c ?? 0) + 1);
      }
    }

    setPending(false);
  }

  const liked = Boolean(likeId);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || pending}
      aria-pressed={liked}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        liked
          ? "border-teal bg-teal/10 text-teal-dark"
          : "border-line text-ink-light hover:border-teal hover:text-teal-dark"
      )}
    >
      {pending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Heart size={16} className={liked ? "fill-teal-dark" : undefined} />
      )}
      {liked ? "Liked" : "Like"}
      {count !== null && <span className="text-muted">· {count}</span>}
    </button>
  );
}
