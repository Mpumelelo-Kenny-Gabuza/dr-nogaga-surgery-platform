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
| 3 | Authentication & roles (ADMIN / EDITOR) | **Done** (this commit) |
| 4 | Public website pages (real content, wired to Supabase) | **Done** (this commit) |
| 5 | CMS admin screens (procedures, resources, FAQs, gallery, testimonials, settings) | Not started |
| 6 | Consultation enquiry form + enquiry dashboard | Not started |
| 7 | Blog likes, comments, moderation, practice replies, sharing | Not started |
| 8 | Security pass (RLS audit, validation, sanitization) | Not started |
| 9 | SEO, sitemap, accessibility pass | Not started |
| 10 | Responsive QA, final polish, documentation | Not started |

Every route in the spec is wired up — see `src/App.tsx`. Public pages
(`/`, `/about`, `/procedures`, `/reconstructive-surgery`, `/resources`,
`/gallery`, `/testimonials`, `/faq`, `/contact`) now render real data from
Supabase. `/consultation`, `/privacy`, `/terms` and `/disclaimer` still
render a labelled placeholder — those are Phase 6 and Phase 9 respectively.

**What's genuinely live right now vs. still pending from the practice** —
Phase 4 wires every page to the database honestly, which means a few
sections currently render an explicit "not published yet" message instead
of invented content, because the underlying rows really are empty or still
marked `DRAFT`/unpublished:
- **Live**: all 15 confirmed procedures, qualifications, practice locations
  (East London, Mthatha, Virtual), consultation fees, homepage/intro copy.
- **Pending the practice's content** (shows an honest empty/pending state,
  not placeholder text): Dr Nogaga's biography and approach-to-patient-care
  paragraphs, professional memberships/affiliations, team member profiles,
  gallery images, blog/patient-resource articles, and testimonials — the
  seed data for the last three exists but is deliberately left `DRAFT` (see
  `20260930091000_seed_data.sql`'s own header) since it's fictional/demo
  copy, not real content to publish.

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

All 15 migrations live in `supabase/migrations/`, applied in filename
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
| `..._add_cancelled_enquiry_status.sql` | Adds the `CANCELLED` enquiry status — split into its own migration/transaction; Postgres won't let a new enum value be used in the same transaction that added it |
| `..._booking_and_locations.sql` | `practice_locations`, Thursday-only/capped first-consultation booking rules + public availability check, `team_members` |
| `..._confirmed_content.sql` | Replaces placeholder procedures with the practice's real, confirmed 15-procedure list, locations, qualifications, fees |
| `..._homepage_copy_polish.sql` | Replaces the remaining `[Demo]`/`[Placeholder]`-tagged homepage copy with real, presentable (but still generic/structural) site copy — see its header comment for exactly what it does and doesn't claim |

**Verified**, not just written: every migration was applied against a real
local Postgres 16 instance (with a minimal stand-in for Supabase's
`auth`/`storage` schemas) and the full chain applies cleanly with no errors.
RLS was then tested as a genuine non-superuser role — anonymous, EDITOR and
ADMIN identities were each simulated and checked against the policies below
(13 cases: published-only visibility, enquiries being write-only for the
public, EDITOR vs ADMIN-only actions, and the self-role-escalation guard).
Phase 4's own queries were re-verified the same way: every public page's
query was run as an anonymous role against the fully-migrated schema,
confirming published content is visible, unpublished/DRAFT content (the
demo posts/testimonials/FAQs) is correctly invisible, and enquiries stay
unreadable. That verification setup is local-only scaffolding and isn't
part of this repo or its history.

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

## 10. Authentication

Supabase Auth, email/password. `src/features/auth/`:

- `AuthProvider.tsx` — tracks the current session + the matching `profiles`
  row (name, role), kept in sync via `onAuthStateChange` so sign-in,
  sign-out, and token refresh all just work, including across tabs.
- `useAuth()` — `{ user, profile, isAdmin, isEditor, signIn, signOut }`.
- `ProtectedRoute.tsx` — wraps every `/admin` route. Unauthenticated →
  redirected to `/admin/login`. A session with no matching *active*
  profile (e.g. a deactivated staff account) is treated the same way and
  signed out, rather than left half-authenticated.

Pages: `/admin/login`, `/admin/forgot-password`, `/admin/reset-password`
(`src/pages/auth/`) — all three deliberately sit outside `ProtectedRoute`,
since you're not signed in yet when you need them.

**The frontend redirect is a UX convenience, not the real boundary** (spec
§22). Every one of these checks is backed by the RLS policies from Phase 2
— an EDITOR who edits the URL to reach `/admin/settings` directly still
can't read or write anything there, because Postgres denies it regardless
of what the UI renders.

**Creating the first ADMIN** (there's no self-service signup, by design —
spec §26):
1. In the Supabase dashboard: Authentication → Users → Add user. Set an
   email + password directly (skip the invite-email flow for this first
   one).
2. The `handle_new_user` trigger fires automatically and creates their
   `profiles` row — as `EDITOR` by default.
3. Promote them: in the SQL editor, `update public.profiles set role = 'ADMIN' where id = '<their user id, from the Users list>';`
4. They can now sign in at `/admin/login` and will see the ADMIN-only
   Settings nav item.

Every account after that first one, an existing ADMIN creates and promotes
the same way (a proper in-app "invite user" screen is Phase 5 — §26).

**Password reset** needs one bit of Supabase dashboard config before it'll
work: Authentication → URL Configuration → Redirect URLs — add
`http://localhost:5173/admin/reset-password` for local dev, and your
production URL once deployed. Without this, Supabase rejects the redirect
and the reset email link won't work.

**Verified**: `tsc --noEmit` and `npm run build` both pass clean with the
full auth flow wired in. A live end-to-end sign-in test needs an actual
Supabase project (this sandbox can reach npm and GitHub but not Supabase's
API), so that's the one thing to manually click through once you've
connected yours — sign in, sign out, try `/admin` while logged out, try a
password reset. Automated tests for this flow are Phase 10's job per the
spec's own phase breakdown (§43/§46).

## 11. Public Website (Phase 4)

Every public page (`src/pages/public/`) fetches directly from Supabase
through `src/lib/supabase/queries.ts` — there's no hardcoded or mocked
content anywhere in the frontend. A shared `useSupabaseQuery` hook
(`src/hooks/`) handles loading/error state consistently, and `<DataState>`
(`src/components/public/`) renders it: a real loading indicator, a real
error message if the query fails, or an honest "nothing published yet"
message if a table legitimately has no published rows — never placeholder
content standing in for real content.

- **Home** (`/`) — hero, intro, reconstructive-surgery highlight, patient
  journey, featured procedures/testimonials, consultation CTA, all from
  `homepage_content`/`about_content`.
- **About** (`/about`) — qualifications, memberships/affiliations, team
  (once published); biography and approach-to-care show a pending message
  until the practice provides them (see §3's content list above).
- **Procedures** (`/procedures`, `/procedures/:slug`) — grouped by
  category; detail page includes images, linked FAQs and related
  testimonials, all conditional on actually having any.
- **Reconstructive Surgery** (`/reconstructive-surgery`) — a dedicated page
  (not just a filtered procedures list), per the practice's emphasis on it.
- **Patient Resources** (`/resources`, `/resources/:slug`) — published
  blog posts only; `content_html` is sanitized with DOMPurify at render
  time (`src/lib/sanitize.ts`), independent of whatever the future Phase 5/7
  editor already does on the way in. Likes/comments/sharing are Phase 7 —
  these are deliberately read-only articles, not a stubbed comment box.
- **Gallery** (`/gallery`) — published images, filterable by category.
- **Testimonials** (`/testimonials`) — published testimonials.
- **FAQ** (`/faq`) — published FAQs, grouped by category where set.
- **Contact** (`/contact`) — practice locations (with their own
  phone/WhatsApp numbers), site-wide contact details, social links, map
  embed — all conditional on what's actually filled in.
- The site footer (`PublicLayout.tsx`) now pulls the same real contact
  data instead of the Phase 1 "To be confirmed" placeholder.

SEO: `usePageMeta()` (`src/hooks/`) sets `<title>` and the meta description
per page from each row's own `seo_title`/`seo_description` columns (falling
back to a sensible default), so those schema columns are actually used.

**Verified**: `tsc --noEmit`, `npm run build` and `npm run lint` all pass
clean (lint itself was dead until this phase — see `eslint.config.js`'s own
comment: the dependencies were installed in Phase 1 but no config file had
ever been committed). Every query above was also run directly against the
fully-migrated schema as a genuine anonymous Postgres role (not the
superuser) — see §7 — to confirm the empty/pending states shown above are
what the real, current production data actually produces, not a guess.

## 12–14. Local dev, production build & deployment, security

Documented as each remaining phase lands.

## Project Structure

```
src/
  components/
    ui/        reusable primitives (Button, Container, Logo)
    public/    public-site components (Phase 4) — DataState, PageHero,
               SectionHeading, ProcedureCard, PostCard, TestimonialCard,
               FaqAccordion, ConsultationCta
    admin/     admin-specific components (Phase 5)
  hooks/
    useSupabaseQuery.ts  loading/error/data state for any Supabase call
    usePageMeta.ts        sets <title> + meta description per page
  layouts/
    PublicLayout.tsx
    AdminLayout.tsx
  lib/
    supabase/queries.ts  every public-facing Supabase query, in one place
    format.ts            ZAR currency / date formatting
    sanitize.ts          DOMPurify wrapper for rendered post HTML
  pages/
    public/    Home, About, Procedures, ProcedureDetail,
               ReconstructiveSurgery, Resources, ArticleDetail, Gallery,
               Testimonials, Faq, Contact (Phase 4)
    admin/     (Phase 5)
    auth/      Login, ForgotPassword, ResetPassword, shared AuthPageShell
  features/
    auth/      AuthProvider, useAuth, ProtectedRoute
    ...        one more folder per domain feature, added as each is built
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
