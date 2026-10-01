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
| 1 | Project foundation, routing, layouts, theme, base UI | **Done** |
| 2 | Supabase schema, migrations, RLS, storage buckets | **Done** (this commit) |
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

## 6. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Install the CLI (already a dev dependency — `npx supabase --version`).
3. `npx supabase login`, then from the project root: `npx supabase link --project-ref <your-project-ref>`.
4. Push the schema: `npm run db:push`. This applies every file in
   `supabase/migrations/` in order — see §7.
5. Copy your project's URL and anon key (Settings → API) into `.env`
   (see §5 above).

## 7. Database Migrations

All 11 migrations live in `supabase/migrations/`, applied in filename
(timestamp) order:

| File | Covers |
|---|---|
| `..._extensions_and_types.sql` | Extensions, enum types, shared `updated_at` trigger |
| `..._profiles.sql` | Staff accounts, auto-create-on-signup trigger, role helper functions |
| `..._site_content.sql` | Homepage/about/site-settings singletons, qualifications, affiliations, social links |
| `..._procedures.sql` | Procedure categories, procedures, procedure images |
| `..._blog.sql` | Post categories/tags, posts, likes, threaded comments |
| `..._gallery_testimonials_faqs.sql` | Gallery, testimonials, FAQs, procedure↔FAQ links |
| `..._enquiries.sql` | Consultation enquiries (with auto-generated reference numbers), internal notes |
| `..._media_and_audit.sql` | Media asset registry, audit log |
| `..._rls_policies.sql` | Row Level Security for every table above — see §8 |
| `..._storage_buckets.sql` | The 4 storage buckets and their access policies |
| `..._seed_data.sql` | Placeholder/demo content, unpublished by default — see its header comment |

**Verified**, not just written: every migration was applied against a real
local Postgres 16 instance (with a minimal stand-in for Supabase's
`auth`/`storage` schemas) and the full chain applies cleanly with no errors.
RLS was then tested as a genuine non-superuser role — anonymous, EDITOR and
ADMIN identities were each simulated and checked against the policies below
(13 cases: published-only visibility, enquiries being write-only for the
public, EDITOR vs ADMIN-only actions, and the self-role-escalation guard).
That verification setup is local-only scaffolding and isn't part of this
repo or its history.

To add a new migration later: `npx supabase migration new <name>`, then
`npm run db:push`.

## 8. Row Level Security

Every table has RLS enabled — nothing relies on the frontend to hide what
it shouldn't show. The short version:

- **Public** can read published content only (`status = 'PUBLISHED'` /
  `published = true`), can submit a consultation enquiry or a comment
  (comments start `PENDING`), and can like a post (signed in, or
  anonymously via a client-generated key).
- **Enquiries and their internal notes are never publicly readable** —
  insert-only for the public, full access for staff.
- **EDITOR** can manage content (procedures, posts, gallery, testimonials,
  FAQs, comments, enquiries) but cannot delete an enquiry, read the audit
  log, or change anyone's role — including their own; a trigger blocks
  self-escalation even if a policy bug ever let the request through.
- **ADMIN** additionally: deletes enquiries, reads the audit log, manages
  other users' roles.

## 9. Storage

Four public-read buckets — `public-assets`, `blog-images`,
`gallery-images`, `profile-images` — each capped at 5MB/file, JPG/PNG/WEBP
only. Public-read is deliberate: this app never stores real patient
documents (§37 of the spec), so there's nothing in these buckets that
needs to be private. Uploads/replaces/deletes are staff-only.

## 10–14. Auth, seed data, local dev, production build, deployment, admin
setup, security

Documented as each remaining phase lands. Phase 3 (authentication) is next.

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
    supabase/
      client.ts          typed Supabase client (reads VITE_SUPABASE_* env vars)
    validation/
    utils/
  hooks/
  types/
    database.types.ts    generated from the schema — regenerate with `npm run db:types`
  services/
supabase/
  config.toml
  migrations/             11 migrations — see README §7
```
