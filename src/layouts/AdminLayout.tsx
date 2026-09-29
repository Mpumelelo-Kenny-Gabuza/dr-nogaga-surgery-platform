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
} from "lucide-react";

const SIDEBAR_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/content", label: "Website Content", icon: FileText },
  { to: "/admin/about", label: "About", icon: FileText },
  { to: "/admin/procedures", label: "Procedures", icon: Stethoscope },
  { to: "/admin/resources", label: "Resources", icon: BookOpen },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare },
  { to: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { to: "/admin/testimonials", label: "Testimonials", icon: Quote },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="flex h-16 items-center justify-between border-b border-line bg-ink px-6 text-white">
        <span className="text-sm font-semibold tracking-wide">
          Dr Nogaga <span className="text-white/40">&middot;</span> Practice Admin
        </span>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs font-medium text-mist hover:text-white"
        >
          View Website <ExternalLink size={14} />
        </Link>
      </header>

      <div className="flex">
        <aside className="hidden w-60 shrink-0 border-r border-line bg-white md:block">
          <nav className="flex flex-col gap-0.5 p-3">
            {SIDEBAR_LINKS.map(({ to, label, icon: Icon, end }) => (
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
