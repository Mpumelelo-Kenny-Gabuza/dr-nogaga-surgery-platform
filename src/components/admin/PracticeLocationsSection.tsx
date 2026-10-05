import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FormSection } from "@/components/admin/AdminFormShell";
import { RepeatableList } from "@/components/admin/RepeatableList";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/features/toast/useToast";
import { createPracticeLocation, deletePracticeLocation, updatePracticeLocation } from "@/lib/supabase/mutations";
import type { PracticeLocation } from "@/types/content";

type LocationForm = {
  id?: string;
  slug: string;
  display_name: string;
  is_physical: boolean;
  address: string | null;
  landline: string | null;
  whatsapp: string | null;
  published: boolean;
};

function toForm(row: PracticeLocation): LocationForm {
  return {
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    is_physical: row.is_physical,
    address: row.address,
    landline: row.landline,
    whatsapp: row.whatsapp,
    published: row.published,
  };
}

const BLANK_LOCATION: LocationForm = {
  slug: "",
  display_name: "",
  is_physical: true,
  address: null,
  landline: null,
  whatsapp: null,
  published: false,
};

/**
 * Unlike the About page's repeatable lists, locations already have stable
 * ids with their own create/update/delete mutations (practice_locations has
 * no delete-all-and-reinsert helper, deliberately — a location's slug is
 * referenced in copy elsewhere, so churning ids on every save would be
 * wasteful). Save diffs the edited array against what was loaded: rows with
 * an id are updated, rows without one are created, and ids that dropped out
 * of the array are deleted.
 */
export function PracticeLocationsSection({
  initial,
  onSaved,
}: {
  initial: PracticeLocation[];
  onSaved: () => void;
}) {
  const toast = useToast();
  const [locations, setLocations] = useState<LocationForm[]>(initial.map(toForm));
  const [saving, setSaving] = useState(false);

  useEffect(() => setLocations(initial.map(toForm)), [initial]);

  async function handleSave() {
    setSaving(true);

    const keptIds = new Set(locations.filter((l) => l.id).map((l) => l.id!));
    const removedIds = initial.map((l) => l.id).filter((id) => !keptIds.has(id));

    const results = await Promise.all([
      ...locations.map((loc, i) => {
        const values = {
          slug: loc.slug,
          display_name: loc.display_name,
          is_physical: loc.is_physical,
          address: loc.address || null,
          landline: loc.landline || null,
          whatsapp: loc.whatsapp || null,
          published: loc.published,
          display_order: i,
        };
        return loc.id ? updatePracticeLocation(loc.id, values) : createPracticeLocation(values);
      }),
      ...removedIds.map((id) => deletePracticeLocation(id)),
    ]);

    setSaving(false);
    const failed = results.some((r) => r.error);
    toast.show(
      failed ? "error" : "success",
      failed ? "Some locations didn't save — check each slug is unique." : "Locations saved."
    );
    if (!failed) onSaved();
  }

  return (
    <FormSection title="Practice Locations">
      <p className="text-xs text-muted">
        Each location needs its own unique slug. East London and Mthatha each keep their own landline and
        WhatsApp number here, separate from the fallback contact details above.
      </p>

      <RepeatableList<LocationForm>
        items={locations}
        onChange={setLocations}
        newItem={() => ({ ...BLANK_LOCATION })}
        addLabel="Add location"
        renderItem={(item, update) => (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Display name"
                value={item.display_name}
                onChange={(e) => update({ display_name: e.target.value })}
              />
              <Field
                label="Slug"
                value={item.slug}
                onChange={(e) => update({ slug: e.target.value })}
                hint="e.g. east-london"
              />
            </div>
            <Textarea
              label="Address"
              rows={2}
              value={item.address ?? ""}
              onChange={(e) => update({ address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Landline"
                value={item.landline ?? ""}
                onChange={(e) => update({ landline: e.target.value })}
              />
              <Field
                label="WhatsApp"
                value={item.whatsapp ?? ""}
                onChange={(e) => update({ whatsapp: e.target.value })}
              />
            </div>
            <div className="flex gap-6">
              <Toggle
                label="Physical location"
                description="Off for a phone-only / virtual contact point."
                checked={item.is_physical}
                onChange={(checked) => update({ is_physical: checked })}
              />
              <Toggle
                label="Published"
                checked={item.published}
                onChange={(checked) => update({ published: checked })}
              />
            </div>
          </div>
        )}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Locations
        </Button>
      </div>
    </FormSection>
  );
}
