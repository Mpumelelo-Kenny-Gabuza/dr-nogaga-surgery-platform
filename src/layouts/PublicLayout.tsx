import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { Logo } from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const NAV_LINKS = [
  { to: "/about", label: "About" },
  { to: "/procedures", label: "Procedures" },
  { to: "/reconstructive-surgery", label: "Reconstructive Surgery" },
  { to: "/resources", label: "Patient Resources" },
  { to: "/gallery", label: "Gallery" },
  { to: "/faq", label: "FAQ" },
];

function NavLinks({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  return (
    <nav className={className}>
      {NAV_LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              "text-[13px] font-medium tracking-wide transition-colors hover:text-teal",
              isActive ? "text-teal" : "text-ink-light"
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="bg-ink px-6 py-2 text-right text-xs tracking-wide text-mist md:px-10">
        Private Practice &middot; Plastic &amp; Reconstructive Surgery
      </div>

      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <Container className="flex h-[78px] items-center justify-between">
          <Logo />

          <NavLinks className="hidden items-center gap-7 lg:flex" />

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/consultation" className={buttonClasses("primary")}>
              Book a Consultation
            </Link>
          </div>

          <button
            className="p-2 text-ink lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </Container>

        {menuOpen && (
          <div className="border-t border-line bg-white lg:hidden">
            <Container className="flex flex-col gap-5 py-6">
              <NavLinks onNavigate={() => setMenuOpen(false)} className="flex flex-col gap-5" />
              <Link
                to="/consultation"
                onClick={() => setMenuOpen(false)}
                className={buttonClasses("primary", "w-full")}
              >
                Book a Consultation
              </Link>
            </Container>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-ink text-mist">
      <Container className="grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo tone="dark" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist/80">
            Specialist plastic and reconstructive surgery, focused on restoring function,
            confidence and quality of life.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Practice</h3>
          <ul className="mt-4 space-y-2 text-sm text-mist/80">
            <li><Link to="/about" className="hover:text-white">About Dr Nogaga</Link></li>
            <li><Link to="/procedures" className="hover:text-white">Procedures</Link></li>
            <li><Link to="/testimonials" className="hover:text-white">Testimonials</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Contact</h3>
          <ul className="mt-4 space-y-2 text-sm text-mist/80">
            <li>Phone: To be confirmed</li>
            <li>Email: To be confirmed</li>
            <li>Practice address: To be confirmed</li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-mist/70 md:flex-row md:items-center md:justify-between">
          <span>&copy; {new Date().getFullYear()} Dr Viwe Nogaga. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/disclaimer" className="hover:text-white">Medical Disclaimer</Link>
          </div>
          <span className="text-mist/70">
            Developed by{" "}
            <a
              href="https://www.mlifi.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Mlifi Solutions
            </a>
          </span>
        </Container>
      </div>
    </footer>
  );
}
