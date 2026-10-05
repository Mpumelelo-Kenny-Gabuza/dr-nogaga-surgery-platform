import { type ReactNode } from "react";

export type AdminColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

/** Generic list table shared by every admin entity screen — columns and row actions are the only thing that differ per entity. */
export function AdminDataTable<T>({
  rows,
  columns,
  keyFor,
  renderActions,
  emptyMessage = "Nothing here yet.",
}: {
  rows: T[];
  columns: AdminColumn<T>[];
  keyFor: (row: T) => string;
  renderActions?: (row: T) => ReactNode;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-line py-16 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-line bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-cream/50 text-xs uppercase tracking-wide text-muted">
            {columns.map((col) => (
              <th key={col.header} className={clsxHeader(col.className)}>
                {col.header}
              </th>
            ))}
            {renderActions && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={keyFor(row)} className="hover:bg-cream/30">
              {columns.map((col) => (
                <td key={col.header} className={clsxCell(col.className)}>
                  {col.render(row)}
                </td>
              ))}
              {renderActions && (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">{renderActions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function clsxHeader(className?: string) {
  return ["px-4 py-3 font-medium", className].filter(Boolean).join(" ");
}
function clsxCell(className?: string) {
  return ["px-4 py-3 align-middle text-ink-light", className].filter(Boolean).join(" ");
}
