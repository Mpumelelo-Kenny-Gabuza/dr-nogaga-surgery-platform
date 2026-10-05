import { Link } from "react-router-dom";
import {
  Stethoscope,
  BookOpen,
  Image as ImageIcon,
  Quote,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { DataState } from "@/components/public/DataState";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/lib/supabase/client";
import { getRecentAuditLogs } from "@/lib/supabase/adminQueries";
import { useAuth } from "@/features/auth/useAuth";
import { formatDate } from "@/lib/format";
import type { AuditLogWithActor } from "@/types/content";
import type { Database } from "@/types/database.types";

type Counts = {
  procedures: { total: number; published: number };
  posts: { total: number; published: number };
  gallery: { total: number; published: number };
  testimonials: { total: number; published: number };
  faqs: { total: number; published: number };
};

type DashboardData = { counts: Counts; recentActivity: AuditLogWithActor[] };

async function countTable(
  table: "procedures" | "posts" | "testimonials",
  publishedValue: Database["public"]["Enums"]["content_status"]
) {
  const [{ count: total }, { count: published }] = await Promise.all([
    supabase.from(table).select("*", { count: "exact", head: true }),
    supabase.from(table).select("*", { count: "exact", head: true }).eq("status", publishedValue),
  ]);
  return { total: total ?? 0, published: published ?? 0 };
}

async function countBooleanTable(table: "gallery_items" | "faqs") {
  const [{ count: total }, { count: published }] = await Promise.all([
    supabase.from(table).select("*", { count: "exact", head: true }),
    supabase.from(table).select("*", { count: "exact", head: true }).eq("published", true),
  ]);
  return { total: total ?? 0, published: published ?? 0 };
}

// audit_logs is ADMIN-only per RLS ("only admins may read the audit log") —
// an EDITOR's own session gets zero rows back, not an error, which would
// otherwise render as a misleading "No admin activity recorded yet." Skip
// the query entirely for a non-admin rather than ask for data RLS will
// just filter to nothing anyway.
async function loadDashboard(isAdmin: boolean) {
  const [procedures, posts, gallery, testimonials, faqs, activity] = await Promise.all([
    countTable("procedures", "PUBLISHED"),
    countTable("posts", "PUBLISHED"),
    countBooleanTable("gallery_items"),
    countTable("testimonials", "PUBLISHED"),
    countBooleanTable("faqs"),
    isAdmin ? getRecentAuditLogs(8) : Promise.resolve({ data: [], error: null }),
  ]);

  return {
    data: {
      counts: { procedures, posts, gallery, testimonials, faqs },
      recentActivity: (activity.data ?? []) as AuditLogWithActor[],
    } satisfies DashboardData,
    error: activity.error,
  };
}

const CARDS = [
  { key: "procedures" as const, label: "Procedures", icon: Stethoscope, to: "/admin/procedures" },
  { key: "posts" as const, label: "Patient Resources", icon: BookOpen, to: "/admin/resources" },
  { key: "gallery" as const, label: "Gallery", icon: ImageIcon, to: "/admin/gallery" },
  { key: "testimonials" as const, label: "Testimonials", icon: Quote, to: "/admin/testimonials" },
  { key: "faqs" as const, label: "FAQs", icon: HelpCircle, to: "/admin/faqs" },
];

export function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const { data, loading, error } = useSupabaseQuery<DashboardData>(
    () => loadDashboard(isAdmin),
    [isAdmin]
  );

  return (
    <div>
      <h1 className="text-2xl text-ink">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
      <p className="mt-1 text-sm text-muted">
        An overview of what's published on the public site right now.
      </p>

      <DataState loading={loading} error={error}>
        {data && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CARDS.map(({ key, label, icon: Icon, to }) => {
                const c = data.counts[key];
                return (
                  <Link
                    key={key}
                    to={to}
                    className="group rounded-sm border border-line bg-white p-5 transition-colors hover:border-teal"
                  >
                    <Icon size={18} className="text-teal" />
                    <p className="mt-3 text-2xl text-ink">{c.published}</p>
                    <p className="text-xs text-muted">
                      published of {c.total} {label.toLowerCase()}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal opacity-0 transition-opacity group-hover:opacity-100">
                      Manage <ArrowRight size={12} />
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Enquiries (Phase 6) and comment moderation (Phase 7) aren't
                built yet — deliberately no "0 new enquiries"-style card
                here that would imply a system that doesn't exist. */}

            <div className="mt-10">
              <h2 className="text-lg text-ink">Recent Activity</h2>
              {!isAdmin ? (
                <p className="mt-3 text-sm text-muted">Visible to admins only.</p>
              ) : data.recentActivity.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No admin activity recorded yet.</p>
              ) : (
                <div className="mt-3 divide-y divide-line rounded-sm border border-line bg-white">
                  {data.recentActivity.map((log) => (
                    <div key={log.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-ink-light">
                        <span className="font-medium text-ink">
                          {log.profiles?.full_name ?? "A staff member"}
                        </span>{" "}
                        {log.action.toLowerCase()}d a {log.entity.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted">{formatDate(log.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
