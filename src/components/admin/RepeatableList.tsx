import { type ReactNode } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

/**
 * Generic ordered-list editor for the small repeatable rows this admin
 * manages (patient journey steps, qualifications, affiliations, social
 * links): add, remove, reorder. Each screen supplies how to render one
 * row's fields; this owns the array mechanics (display_order is whatever
 * the array index is when saved — callers don't need to track it here).
 */
export function RepeatableList<T>({
  items,
  onChange,
  renderItem,
  newItem,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  newItem: () => T;
  addLabel: string;
}) {
  function update(index: number, patch: Partial<T>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex gap-3 rounded-sm border border-line bg-white p-4">
          <div className="flex-1">{renderItem(item, (patch) => update(index, patch), index)}</div>
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="rounded p-1 text-muted hover:bg-cream disabled:opacity-30"
              aria-label="Move up"
            >
              <ChevronUp size={15} />
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === items.length - 1}
              className="rounded p-1 text-muted hover:bg-cream disabled:opacity-30"
              aria-label="Move down"
            >
              <ChevronDown size={15} />
            </button>
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-1 rounded p-1 text-muted hover:bg-red-50 hover:text-red-600"
              aria-label="Remove"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, newItem()])}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
      >
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );
}
