# Dr Viwe Nogaga — Practice Website & CMS

Production website and admin platform for Dr Viwe Nogaga, a plastic and
reconstructive surgery practice. Public marketing site + a lightweight,
authenticated CMS for managing procedures, patient resources, gallery,
testimonials, FAQs and consultation enquiries.

Built in phases — see **Build Status** below for what's real right now
versus what's still a placeholder route.

## 1. Project Overview

- **Public site**: home, about, procedures, reconstructive surgery, patient
  resources/blog, gallery, testimonials, FAQ, contact, consultation enquiry.
- **Admin CMS**: authenticated dashboard for managing all public content and
  incoming consultation enquiries.
- Brand colors are derived from the practice's own logo (`src/assets/logo.jpeg`,
  `src/assets/logo-mark.png`) — teal `#176B68` / `#1E94A0`, charcoal `#172525` /
  `#4C4D4B`, cream `#F5F3EE`. See `tailwind.config.js`.

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Supabase (Postgres, Auth, Storage, Row Level Security)
- **Icons**: lucide-react

## 3. Build Status

| Phase | What it covers | Status |
|---|---|---|
| 1 | Project foundation, routing, layouts, theme, base UI | **Done** (this commit) |
| 2 | Supabase schema, migrations, RLS, storage buckets | Not started |
| 3 | Authentication & roles (ADMIN / EDITOR) | Not started |
| 4 | Public website pages (real content, wired to Supabase) | Not started |
| 5 | CMS admin screens (procedures, resources, FAQs, gallery, testimonials, settings) | Not started |
| 6 | Consultation enquiry form + enquiry dashboard | Not started |
| 7 | Blog likes, comments, moderation, practice replies, sharing | Not started |
| 8 | Security pass (RLS audit, validation, sanitization) | Not started |
| 9 | SEO, sitemap, accessibility pass | Not started |
| 10 | Responsive QA, final polish, documentation | Not started |

Every route in the spec is wired up now and renders a labelled placeholder
page — see `src/App.tsx` — so navigation and layout can be reviewed before
real content is built on top of it.

## 4. Installation

```bash
npm install
npm run dev
```

## 5. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase project's public
values (Settings → API in the Supabase dashboard):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never put the **service role** key here — it must never reach the browser.
Server-side-only operations go in Supabase Edge Functions (Phase 2).

## 6–14. Supabase setup, migrations, storage, auth, seed data, local dev,
production build, deployment, admin setup, security

Documented as each phase lands. Phase 2 (Supabase schema + migrations) is
next.

## Project Structure

```
src/
  components/
    ui/        reusable primitives (Button, Container, Logo)
    public/    public-site-specific components (Phase 4)
    admin/     admin-specific components (Phase 5)
  layouts/
    PublicLayout.tsx
    AdminLayout.tsx
  pages/
    public/    (Phase 4)
    admin/     (Phase 5)
    auth/      (Phase 3)
  features/    one folder per domain feature, added as each is built
  lib/
    supabase/  Supabase client + typed helpers (Phase 2)
    validation/
    utils/
  hooks/
  types/
  services/
supabase/
  migrations/  SQL migrations (Phase 2)
```
