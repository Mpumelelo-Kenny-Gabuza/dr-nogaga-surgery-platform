import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/types/database.types";

/**
 * Appends one row to audit_logs (spec §27 — "who did what, to which
 * record, when"). Called after every admin create/update/delete — see
 * src/lib/supabase/mutations.ts, which wraps this so individual admin
 * pages never have to remember to call it themselves.
 *
 * Best-effort: a logging failure must never block the actual mutation it's
 * describing (which has already succeeded by the time this runs), so
 * errors are swallowed here rather than surfaced to the editor.
 */
export async function logAction(
  action: "CREATE" | "UPDATE" | "DELETE",
  entity: string,
  entityId: string | null,
  metadata?: Record<string, Json>
) {
  const { data: userData } = await supabase.auth.getUser();
  const actorId = userData.user?.id;
  if (!actorId) return;

  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId,
    metadata: metadata ?? null,
  });
}
