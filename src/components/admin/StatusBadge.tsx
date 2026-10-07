import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-teal/10 text-teal-dark",
  DRAFT: "bg-mist/60 text-ink-light",
  ARCHIVED: "bg-line text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-line text-muted"
      )}
    >
      {status}
    </span>
  );
}

/** For the simpler boolean `published` columns (gallery_items, faqs, social_links, team_members). */
export function PublishedBadge({ published }: { published: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        published ? "bg-teal/10 text-teal-dark" : "bg-mist/60 text-ink-light"
      )}
    >
      {published ? "PUBLISHED" : "UNPUBLISHED"}
    </span>
  );
}

// The enquiries workflow (Phase 6) — a separate enum from content_status
// above, so it gets its own style map rather than overloading STATUS_STYLES
// with unrelated values.
const ENQUIRY_STATUS_STYLES: Record<string, string> = {
  NEW: "bg-teal/10 text-teal-dark",
  CONTACTED: "bg-blue-50 text-blue-700",
  CONSULTATION_BOOKED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-mist/60 text-ink-light",
  CANCELLED: "bg-line text-muted",
};

export function EnquiryStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        ENQUIRY_STATUS_STYLES[status] ?? "bg-line text-muted"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
