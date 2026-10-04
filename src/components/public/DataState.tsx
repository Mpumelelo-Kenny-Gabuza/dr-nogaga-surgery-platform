import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";

/**
 * Standard loading/error/empty handling for every data-driven public page.
 * Centralizing this is what keeps "no fake functionality" honest in
 * practice: a page either shows real data, a real loading state, a real
 * error, or an explicit "nothing published yet" message — never silently
 * substituted placeholder content.
 */
export function DataState({
  loading,
  error,
  isEmpty,
  emptyMessage,
  children,
}: {
  loading: boolean;
  error: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" aria-hidden />
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-sm border border-line bg-cream/60 px-5 py-4 text-sm text-ink-light">
        We couldn't load this content right now. Please try refreshing the page, or contact the
        practice directly if the problem continues.
      </div>
    );
  }

  if (isEmpty) {
    return (
      <p className="py-8 text-sm text-muted">
        {emptyMessage ?? "Nothing has been published here yet — check back soon."}
      </p>
    );
  }

  return <>{children}</>;
}
