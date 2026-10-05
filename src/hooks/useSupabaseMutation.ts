import { useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Tracks in-flight/error state for a single admin write (create, update,
 * delete). Pairs with useSupabaseQuery, which handles the read side —
 * every admin form uses this instead of hand-rolling its own submit state.
 */
export function useSupabaseMutation<Args extends unknown[], T>(
  mutationFn: (...args: Args) => Promise<{ data?: T; error: PostgrestError | Error | null }>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  async function mutate(...args: Args) {
    setLoading(true);
    setError(null);
    try {
      const result = await mutationFn(...args);
      setLoading(false);
      if (result.error) setError(result.error);
      return result;
    } catch (err) {
      setLoading(false);
      const asError = err instanceof Error ? err : new Error(String(err));
      setError(asError);
      return { data: undefined, error: asError };
    }
  }

  return { mutate, loading, error };
}
