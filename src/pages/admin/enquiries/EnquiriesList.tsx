import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { DataState } from "@/components/public/DataState";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { EnquiryStatusBadge } from "@/components/admin/StatusBadge";
import { Select } from "@/components/ui/Select";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAllEnquiries } from "@/lib/supabase/adminQueries";
import { formatDate } from "@/lib/format";
import { formatDayMonth } from "@/lib/dates";
import type { EnquiryWithLocation } from "@/types/content";
import type { Database } from "@/types/database.types";

type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];

const STATUS_FILTERS: { value: EnquiryStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CONSULTATION_BOOKED", label: "Consultation booked" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const APPOINTMENT_LABEL: Record<Database["public"]["Enums"]["appointment_type"], string> = {
  NEW_CONSULTATION: "New consultation",
  REVIEW_FOLLOWUP: "Review / follow-up",
};

const CONTACT_LABEL: Record<Database["public"]["Enums"]["preferred_contact_method"], string> = {
  WHATSAPP: "WhatsApp",
  PHONE: "Phone",
  EMAIL: "Email",
};

/** The appointment-type + preferred-date pair, formatted as one line for the table. */
function AppointmentCell({ row }: { row: EnquiryWithLocation }) {
  return (
    <div>
      <span className="text-ink-light">{APPOINTMENT_LABEL[row.appointment_type]}</span>
      <div className="text-xs text-muted">
        {row.preferred_date ? formatDayMonth(row.preferred_date) : "No date given"}
      </div>
    </div>
  );
}

export function EnquiriesList() {
  const { data, loading, error } = useSupabaseQuery<EnquiryWithLocation[]>(async () => {
    const { data, error } = await getAllEnquiries();
    return { data: (data as EnquiryWithLocation[] | null) ?? [], error };
  }, []);

  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    if (!data) return [];
    return statusFilter === "ALL" ? data : data.filter((row) => row.status === statusFilter);
  }, [data, statusFilter]);

  const newCount = data?.filter((row) => row.status === "NEW").length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">Enquiries</h1>
          <p className="mt-1 text-sm text-muted">
            Consultation requests submitted through the public site.
            {data && newCount > 0 && (
              <span className="ml-1 font-medium text-teal-dark">
                {newCount} new, awaiting a response.
              </span>
            )}
          </p>
        </div>
        <div className="w-56">
          <Select
            label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EnquiryStatus | "ALL")}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-8">
        <DataState loading={loading} error={error}>
          {data && (
            <AdminDataTable
              rows={filtered}
              keyFor={(row) => row.id}
              emptyMessage={
                statusFilter === "ALL"
                  ? "No enquiries have been submitted yet."
                  : "No enquiries match this filter."
              }
              columns={[
                {
                  header: "Reference",
                  render: (row) => (
                    <Link
                      to={`/admin/enquiries/${row.id}`}
                      className="font-medium text-teal hover:underline"
                    >
                      {row.reference}
                    </Link>
                  ),
                },
                {
                  header: "Patient",
                  render: (row) => (
                    <div>
                      <span className="font-medium text-ink">
                        {row.first_name} {row.surname}
                      </span>
                      <div className="text-xs text-muted">{row.phone}</div>
                    </div>
                  ),
                },
                {
                  header: "Contact via",
                  render: (row) => CONTACT_LABEL[row.preferred_contact_method],
                },
                { header: "Area of enquiry", render: (row) => row.area_of_enquiry || "—" },
                {
                  header: "Location",
                  render: (row) => row.practice_locations?.display_name ?? "No preference",
                },
                { header: "Appointment", render: (row) => <AppointmentCell row={row} /> },
                { header: "Status", render: (row) => <EnquiryStatusBadge status={row.status} /> },
                { header: "Submitted", render: (row) => formatDate(row.created_at) },
              ]}
              renderActions={(row) => (
                <Link
                  to={`/admin/enquiries/${row.id}`}
                  className="text-sm font-medium text-teal hover:underline"
                >
                  View
                </Link>
              )}
            />
          )}
        </DataState>
      </div>
    </div>
  );
}
