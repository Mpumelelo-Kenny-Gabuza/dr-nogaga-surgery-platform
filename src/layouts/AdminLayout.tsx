import { NavLink, Outlet, Link } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  FileText,
  Stethoscope,
  BookOpen,
  MessageSquare,
  Image as ImageIcon,
  Quote,
  HelpCircle,
  Inbox,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";

const SIDEBAR_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true, adminOnly: false },
  { to: "/admin/content", label: "Website Content", icon: FileText, adminOnly: false },
  { to: "/admin/about", label: "About", icon: FileText, adminOnly: false },
  { to: "/admin/procedures", label: "Procedures", icon: Stethoscope, adminOnly: false },
  { to: "/admin/resources", label: "Resources", icon: BookOpen, adminOnly: false },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare, adminOnly: false },
  { to: "/admin/gallery", label: "Gallery", icon: ImageIcon, adminOnly: false },
  { to: "/admin/testimonials", label: "Testimonials", icon: Quote, adminOnly: false },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle, adminOnly: false },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox, adminOnly: false },
  // ADMIN-only per spec §23 ("modify critical settings", "modify roles").
  // Hiding it for EDITOR is a UX nicety, not the real boundary — RLS
  // already blocks the underlying writes regardless of what's rendered.
  { to: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function AdminLayout() {
  const { profile, isAdmin, signOut } = useAuth();
  const links = SIDEBAR_LINKS.filter((link) => !link.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex h-16 items-center justify-between border-b border-line bg-ink px-6 text-white">
        <span className="text-sm font-semibold tracking-wide">
          Dr Nogaga <span className="text-white/40">&middot;</span> Practice Admin
        </span>

        <div className="flex items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-medium text-mist hover:text-white"
          >
            View Website <ExternalLink size={14} />
          </Link>

          <div className="h-5 w-px bg-white/15" />

          <span className="text-xs text-mist">
            {profile?.full_name || "Account"}
            <span className="ml-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
              {profile?.role}
            </span>
          </span>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-xs font-medium text-mist hover:text-white"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden w-60 shrink-0 border-r border-line bg-white md:block">
          <nav className="flex flex-col gap-0.5 p-3">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-mist/60 text-teal-dark" : "text-ink-light hover:bg-cream"
                  )
                }
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
