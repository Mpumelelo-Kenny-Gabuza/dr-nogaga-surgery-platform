import { useEffect, useState, type DependencyList } from "react";
import type { PostgrestError } from "@supabase/supabase-js";

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  /** A real Postgres/PostgREST error (e.g. RLS denial, bad query) — never swallowed silently. */
  error: PostgrestError | Error | null;
  /** Re-runs the query — admin list pages call this after a delete/create elsewhere instead of a full reload. */
  refetch: () => void;
};

/**
 * Runs an async Supabase query and tracks loading/error/data state, with the
 * standard "ignore a response that arrives after the component moved on"
 * guard (same pattern as AuthProvider). Every public page uses this instead
 * of hand-rolling its own useEffect — one place to get cancellation and
 * error handling right.
 *
 * `deps` works exactly like useEffect's dependency array: include anything
 * the query closure reads (e.g. a route param) so it re-runs when it changes.
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | Error | null }>,
  deps: DependencyList
): QueryState<T> {
  const [state, setState] = useState<Omit<QueryState<T>, "refetch">>({
    data: null,
    loading: true,
    error: null,
  });
  const [refetchCount, setRefetchCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    queryFn()
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({ data, loading: false, error });
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setState({ data: null, loading: false, error });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchCount]);

  return { ...state, refetch: () => setRefetchCount((c) => c + 1) };
}
