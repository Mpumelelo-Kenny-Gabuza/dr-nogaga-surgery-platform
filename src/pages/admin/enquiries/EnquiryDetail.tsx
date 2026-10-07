import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { DataState } from "@/components/public/DataState";
import { FormSection } from "@/components/admin/AdminFormShell";
import { EnquiryStatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getEnquiryById, getEnquiryNotes } from "@/lib/supabase/adminQueries";
import { addEnquiryNote, deleteEnquiry, updateEnquiryStatus } from "@/lib/supabase/mutations";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { formatDate } from "@/lib/format";
import { formatDayMonth } from "@/lib/dates";
import type { EnquiryNoteWithAuthor, EnquiryWithLocation } from "@/types/content";
import type { Database } from "@/types/database.types";

type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];

const STATUS_OPTIONS: EnquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "CONSULTATION_BOOKED",
  "CLOSED",
  "CANCELLED",
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

type LoadedData = { enquiry: EnquiryWithLocation; notes: EnquiryNoteWithAuthor[] };

/**
 * There is deliberately no "create a new enquiry" form anywhere in the
 * admin — every enquiry a staff member sees here is one a patient actually
 * submitted through /consultation (via the submit_enquiry RPC). Staff only
 * ever manage what patients sent in: changing status and adding internal
 * notes, never fabricating a new one.
 */
export function EnquiryDetail() {
  const { id } = useParams();

  const { data, loading, error, refetch } = useSupabaseQuery<LoadedData>(async () => {
    const [enquiry, notes] = await Promise.all([getEnquiryById(id!), getEnquiryNotes(id!)]);

    if (enquiry.error || !enquiry.data) {
      return { data: null, error: enquiry.error ?? new Error("Enquiry not found") };
    }

    return {
      data: {
        enquiry: enquiry.data as EnquiryWithLocation,
        notes: (notes.data as EnquiryNoteWithAuthor[] | null) ?? [],
      } satisfies LoadedData,
      error: notes.error,
    };
  }, [id]);

  return (
    <DataState loading={loading} error={error}>
      {data && <DetailBody data={data} onChanged={refetch} />}
    </DataState>
  );
}

function DetailBody({ data, onChanged }: { data: LoadedData; onChanged: () => void }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const { enquiry, notes } = data;

  const [statusSaving, setStatusSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleStatusChange(status: EnquiryStatus) {
    if (status === enquiry.status) return;
    setStatusSaving(true);
    const { error } = await updateEnquiryStatus(enquiry.id, status);
    setStatusSaving(false);
    toast.show(error ? "error" : "success", error ? "Couldn't update the status." : "Status updated.");
    if (!error) onChanged();
  }

  async function handleAddNote() {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    setNoteSaving(true);
    const { error } = await addEnquiryNote(enquiry.id, trimmed);
    setNoteSaving(false);
    if (error) {
      toast.show("error", "Couldn't save that note.");
      return;
    }
    setNoteText("");
    toast.show("success", "Note added.");
    onChanged();
  }

  async function handleDelete() {
    const { error } = await deleteEnquiry(enquiry.id);
    setConfirmDelete(false);
    if (error) {
      toast.show("error", "Couldn't delete this enquiry.");
      return;
    }
    toast.show("success", "Enquiry deleted.");
    navigate("/admin/enquiries");
  }

  return (
    <div>
      <Link
        to="/admin/enquiries"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={14} /> Back to Enquiries
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">{enquiry.reference}</h1>
          <p className="mt-1 text-sm text-muted">Submitted {formatDate(enquiry.created_at)}</p>
        </div>

        {/* ADMIN-only per RLS ("admins may delete an enquiry" — migration
            20260930090800). Hiding it for EDITOR is a UX nicety on top of
            the real database boundary, same pattern as the Settings route
            comment in App.tsx. */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-red-600"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <FormSection title="Patient Details">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <DetailRow label="Name" value={`${enquiry.first_name} ${enquiry.surname}`} />
              <DetailRow label="Phone" value={enquiry.phone} />
              <DetailRow label="Email" value={enquiry.email ?? "—"} />
              <DetailRow
                label="Preferred contact"
                value={CONTACT_LABEL[enquiry.preferred_contact_method]}
              />
            </dl>
          </FormSection>

          <FormSection title="Enquiry Details">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <DetailRow label="Area of enquiry" value={enquiry.area_of_enquiry || "—"} />
              <DetailRow
                label="Location preference"
                value={enquiry.practice_locations?.display_name ?? "No preference"}
              />
              <DetailRow label="Appointment type" value={APPOINTMENT_LABEL[enquiry.appointment_type]} />
              <DetailRow
                label="Preferred date"
                value={enquiry.preferred_date ? formatDayMonth(enquiry.preferred_date) : "No date given"}
              />
              <DetailRow label="POPIA consent" value={enquiry.consent ? "Given" : "Not given"} />
            </dl>
            {enquiry.message && (
              <div className="border-t border-line pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Message</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-light">{enquiry.message}</p>
              </div>
            )}
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title="Status">
            <EnquiryStatusBadge status={enquiry.status} />
            <Select
              label="Change status"
              value={enquiry.status}
              disabled={statusSaving}
              onChange={(e) => handleStatusChange(e.target.value as EnquiryStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </FormSection>

          <FormSection title="Internal Notes">
            <p className="text-xs text-muted">Visible to staff only — never shown to the patient.</p>

            <Textarea
              label="Add a note"
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Called patient, left voicemail..."
            />
            <div className="flex justify-end">
              <Button type="button" onClick={handleAddNote} disabled={noteSaving || !noteText.trim()}>
                {noteSaving && <Loader2 size={14} className="animate-spin" />}
                Add Note
              </Button>
            </div>

            {notes.length === 0 ? (
              <p className="border-t border-line pt-4 text-sm text-muted">No notes yet.</p>
            ) : (
              <ul className="space-y-3 border-t border-line pt-4">
                {notes.map((note) => (
                  <li key={note.id} className="text-sm">
                    <p className="whitespace-pre-wrap text-ink-light">{note.note}</p>
                    <p className="mt-1 text-xs text-muted">
                      {note.profiles?.full_name ?? "A staff member"} &middot; {formatDate(note.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </FormSection>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this enquiry?"
        description="This permanently removes the enquiry and its internal notes. This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-ink-light">{value}</dd>
    </div>
  );
}
