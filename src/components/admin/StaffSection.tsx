import { useState } from "react";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { FormSection } from "@/components/admin/AdminFormShell";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { setProfileActive, updateProfileRole } from "@/lib/supabase/mutations";
import type { Database } from "@/types/database.types";
import type { Profile } from "@/types/content";

/**
 * Role and active-status changes only ever touch an existing profiles row —
 * see the comment in mutations.ts for why "create a new staff login" is
 * deliberately not a feature here (it needs a service-role Edge Function
 * that doesn't exist yet; account creation stays a manual Supabase-dashboard
 * step per the README). The signed-in admin's own row has both controls
 * disabled: on top of the existing prevent_role_self_escalation DB trigger,
 * this also stops someone from locking themselves out by deactivating their
 * own account.
 */
export function StaffSection({ initial, onChanged }: { initial: Profile[]; onChanged: () => void }) {
  const { profile: currentProfile } = useAuth();
  const toast = useToast();
  const [pending, setPending] = useState<Set<string>>(new Set());

  function setRowPending(id: string, isPending: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      if (isPending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleRoleChange(row: Profile, role: Database["public"]["Enums"]["user_role"]) {
    setRowPending(row.id, true);
    const { error } = await updateProfileRole(row.id, role);
    setRowPending(row.id, false);
    toast.show(
      error ? "error" : "success",
      error ? "Couldn't change that role." : `${row.full_name ?? "That account"} is now ${role}.`
    );
    if (!error) onChanged();
  }

  async function handleActiveToggle(row: Profile, isActive: boolean) {
    setRowPending(row.id, true);
    const { error } = await setProfileActive(row.id, isActive);
    setRowPending(row.id, false);
    toast.show(
      error ? "error" : "success",
      error ? "Couldn't update that account." : isActive ? "Account re-activated." : "Account deactivated."
    );
    if (!error) onChanged();
  }

  return (
    <FormSection title="Staff Access">
      <p className="text-xs text-muted">
        Adding a brand-new staff login is a manual Supabase-dashboard step (see the README) — it needs a
        key that can't safely live in the browser. This only manages people who already have an account.
      </p>

      <AdminDataTable
        rows={initial}
        keyFor={(row) => row.id}
        emptyMessage="No staff accounts yet."
        columns={[
          {
            header: "Name",
            render: (row) => (
              <span className="font-medium text-ink">
                {row.full_name ?? "—"}
                {row.id === currentProfile?.id && <span className="ml-1.5 text-xs text-muted">(you)</span>}
              </span>
            ),
          },
          {
            header: "Role",
            render: (row) => {
              const disabled = row.id === currentProfile?.id || pending.has(row.id);
              return (
                <Select
                  label="Role"
                  value={row.role}
                  disabled={disabled}
                  onChange={(e) =>
                    handleRoleChange(row, e.target.value as Database["public"]["Enums"]["user_role"])
                  }
                  className="w-32"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="EDITOR">Editor</option>
                </Select>
              );
            },
          },
          {
            header: "Active",
            render: (row) => {
              const disabled = row.id === currentProfile?.id || pending.has(row.id);
              return (
                <Toggle
                  label="Active"
                  checked={row.is_active}
                  disabled={disabled}
                  onChange={(checked) => handleActiveToggle(row, checked)}
                />
              );
            },
          },
        ]}
      />
    </FormSection>
  );
}
