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
| 5 | CMS admin screens (procedures, resources, FAQs, gallery, testimonials, settings) | **Done** |
| 6 | Consultation enquiry form + enquiry dashboard | **Done** (this commit) |
| 7 | Blog likes, comments, moderation, practice replies, sharing | Not started |
| 8 | Security pass (RLS audit, validation, sanitization) | Not started |
| 9 | SEO, sitemap, accessibility pass | Not started |
| 10 | Responsive QA, final polish, documentation | Not started |

Every route in the spec is wired up — see `src/App.tsx`. Public pages
(`/`, `/about`, `/procedures`, `/reconstructive-surgery`, `/resources`,
`/gallery`, `/testimonials`, `/faq`, `/contact`, `/consultation`) now render
real data from Supabase. `/privacy`, `/terms` and `/disclaimer` still render
a labelled placeholder — those are Phase 9.

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

All 16 migrations live in `supabase/migrations/`, applied in filename
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
| `..._submit_enquiry_function.sql` | `submit_enquiry()` RPC (the public form's only write path — see §13), and a `security definer` fix to `check_thursday_capacity()` that closes a real pre-existing capacity-enforcement gap — see §13 for what the gap was and how it was found |

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

## 12. CMS Admin (Phase 5)

Every admin screen writes directly to Supabase through
`src/lib/supabase/mutations.ts` — there is no mock data, no local-only
state standing in for a save, and no "Coming soon" admin page left in
`App.tsx`. Reads go through a parallel `src/lib/supabase/adminQueries.ts`
(returns every row regardless of status, unlike the public `queries.ts`)
— safe only because RLS grants staff full `SELECT`, never because this
file filters anything itself.

- **Dashboard** (`/admin`) — published-vs-total counts for procedures,
  resources, gallery, testimonials and FAQs, each linking to its section,
  plus a Recent Activity feed from `audit_logs`. That feed only queries
  (and only renders) for an ADMIN — `audit_logs` is ADMIN-only per RLS, so
  an EDITOR's own session would otherwise get back zero rows and show a
  misleading "No admin activity recorded yet." instead of the honest
  "Visible to admins only."
- **Website Content** (`/admin/content`) — the `homepage_content` singleton
  (hero, intro, reconstructive-surgery highlight, patient journey steps,
  consultation CTA) and `social_links`.
- **About** (`/admin/about`) — the `about_content` singleton (biography,
  approach to care — with a hint that blank is the honest state until the
  practice provides final wording) plus qualifications, affiliations and
  team members, each a reorderable repeatable list.
- **Procedures** (`/admin/procedures`) — full CRUD: category, descriptions,
  patient/preparation/recovery information, a reorderable gallery of
  images (uploaded straight to Storage), related FAQs, publishing status,
  and SEO fields.
- **Resources** (`/admin/resources`) — blog post CRUD with a real WYSIWYG
  editor (TipTap, not a hand-rolled `contentEditable`), tags, reading time,
  and `published_at` set automatically the moment a post is first marked
  Published rather than editable by hand.
- **Gallery / Testimonials / FAQs** (`/admin/gallery`,
  `/admin/testimonials`, `/admin/faqs`) — straightforward CRUD, each with
  image upload where relevant and a real confirm dialog before delete.
- **Settings** (`/admin/settings`) — the `site_settings` singleton
  (contact details, fees, footer/SEO defaults), `practice_locations`
  CRUD (East London and Mthatha each keep their own landline/WhatsApp), and
  staff access: change an existing account's role or active status. The
  signed-in admin's own row has both controls disabled in the UI — on top
  of the `prevent_role_self_escalation` trigger (§8), this also stops
  someone locking themselves out by deactivating their own account.
  **Creating a brand-new staff login is deliberately not here** — it needs
  Supabase's admin API (a service-role key), which must never run in the
  browser, so it stays the manual dashboard step in §10.

Shared admin infrastructure, reused across every screen above:
`AdminDataTable`, `AdminFormShell`/`FormSection`, `RepeatableList` (generic
add/reorder/remove for arrays), `ConfirmDialog` (a real modal, not
`window.confirm`), `ImageUploadField` (uploads to Storage and registers the
file in `media_assets`, independent of whatever content record references
it — the start of a Media Library), `RichTextEditor` (TipTap, sanitized
with the same DOMPurify wrapper Phase 4 uses to render it), and a toast
notification system for save feedback. Every create/update/delete call in
`mutations.ts` writes an `audit_logs` row after it succeeds (best-effort —
a logging failure never blocks the mutation it's describing), satisfying
the "who did what, to which record, when" requirement without each page
having to remember to call it itself.

**Verified**: `tsc --noEmit`, `npm run build` and `npm run lint` all pass
clean. Beyond that, every write path above was re-applied against a fresh
local Postgres 16 instance (the same disposable `auth`/`storage` stand-in
used to verify Phases 2–4) and run as genuine non-superuser roles — not
the `postgres` superuser, which bypasses RLS entirely:

- An **EDITOR** identity can create/update/delete across every table this
  phase's admin screens touch (procedures, posts, gallery items,
  testimonials, FAQs, the three content singletons, qualifications,
  affiliations, team members, social links, practice locations) and can
  insert an `audit_logs` row (what `logAction()` does after every
  mutation) — but genuinely cannot read the audit log back (0 rows, not
  an error), cannot delete an enquiry, and — the specific defense-in-depth
  case the `prevent_role_self_escalation` trigger exists for — cannot
  promote themselves to ADMIN even though the "update own profile" policy
  would otherwise let the UPDATE reach the table at all.
- An **ADMIN** identity can do everything above, can read the audit log
  (confirmed it sees the row the EDITOR identity inserted), can delete an
  enquiry, and can change another profile's role/active status.
- An **anonymous** identity still cannot read enquiries.

That test run caught one real bug before it reached this commit: the
Dashboard's Recent Activity feed was querying `audit_logs` for every
signed-in staff member, which — now confirmed directly rather than
assumed — RLS silently empties for an EDITOR, rendering a false "No
activity" instead of "you can't see this." Fixed as described above. This
verification setup is local-only scaffolding and isn't part of this repo
or its history, same as Phases 2–4.

## 13. Consultation Enquiries (Phase 6)

**Public** (`/consultation`, `src/pages/public/Consultation.tsx`) — a single
form covering all three enquiry paths the practice needs:

- **New Consultation** — first-time patients, Thursdays only. The date
  picker is fed by `get_thursday_availability()` (a `security definer` RPC,
  already in place since the Phase 5 booking migration), so the "3 of 5
  left" / "Fully booked" labels are real remaining-capacity numbers, never
  a client-side guess.
- **Review / Follow-up** — existing patients, Mondays only. These have no
  capacity cap, so the next 8 Mondays are computed locally
  (`src/lib/dates.ts`) rather than round-tripping for data that doesn't
  exist.
- **General Question** — no date required. This deliberately reuses the
  schema's `NEW_CONSULTATION` appointment type with `preferred_date` left
  `null`, rather than adding a third `appointment_type` enum value for a
  presentation-only concept — the existing day-of-week trigger already
  treats a null `preferred_date` as a no-op.

The area-of-enquiry dropdown is sourced from real published procedures
(plus a free-text "Something else"), the location field from real published
`practice_locations`, and the POPIA consent checkbox is required before
submission is even attempted. On success the patient sees the real
server-generated reference number (`ENQ-2026-00001`-style) — never a
client-invented one.

**Why a dedicated `submit_enquiry()` RPC** (`supabase/migrations/..._submit_enquiry_function.sql`,
wrapped by `src/lib/supabase/enquiry.ts`) **instead of a raw insert**: the
public "anyone may submit a consultation enquiry" INSERT policy from Phase 2
still works unchanged (confirmed in this phase's RLS battery, see below),
but a plain `.insert(values).select()` doesn't — the same RETURNING-visibility
mechanism documented for `audit_logs` in §12: supabase-js's `.select()` adds
`Prefer: return=representation` (a `RETURNING` at the SQL level), and an
anonymous visitor has no `SELECT` policy on `enquiries` to satisfy it, so
the whole insert fails even though its own `WITH CHECK` passed. `submit_enquiry()`
is `security definer`, does the insert itself, and returns only `{id, reference}`
— never the full row — so the patient gets a real confirmation without
needing a public `SELECT` policy on a table that must stay staff-only.

**A real bug found and fixed in the course of building this**: the
Thursday booking cap (5 per day, enforced by `check_thursday_capacity()`,
written in Phase 5) was never actually effective for genuine public
submissions. The trigger counts existing non-cancelled `NEW_CONSULTATION`
rows for the target date — but that `COUNT` runs as whatever role fired the
triggering statement, and an anonymous visitor has no `SELECT` policy on
`enquiries`, so the trigger's own count of *other* people's bookings was
silently near-zero every time, regardless of how full the day actually was.
This wasn't caught earlier because every prior test of it ran as a staff or
superuser role, which can see the real count. Found by reproducing it
directly against a local Postgres instance — a 6th booking for an
already-full Thursday succeeded when it should have been rejected,
confirmed against the real row count as superuser — not by inspection
alone. Fixed by adding `security definer set search_path = public` to the
trigger function itself (same fix shape as `get_thursday_availability()`
already had). Re-verified after the fix: 5 sequential bookings for the same
Thursday succeed with real reference numbers, and a 6th is correctly
rejected with the trigger's own "fully booked" exception.

**Admin** (`/admin/enquiries`, `/admin/enquiries/:id`,
`src/pages/admin/enquiries/`) — a list (filterable by status) and a detail
page for enquiries patients actually submitted. There is deliberately no
"staff creates a new enquiry" feature anywhere in the admin — this only
ever manages what came in through the public form. From the detail page,
any staff member can change status and add internal notes (never shown to
the patient); deleting an enquiry is ADMIN-only, enforced by RLS and hidden
for EDITOR in the UI as a nicety, same pattern as the staff-management
screen in §12. The Dashboard also gets a real "new enquiries" stat card now
— Phase 5 deliberately left that card out, with a code comment explaining
why (no system to report on yet); now that the system is real, the card is
too.

**Verified**: `tsc --noEmit`, `npm run build` and `npm run lint` all pass
clean. Beyond the capacity-bug reproduction above, this phase's full
admin surface was re-run against a fresh local Postgres 16 instance as
genuine non-superuser roles:

- **anonymous** can still submit directly with `status = 'NEW'` (unchanged
  Phase 2 policy) but not with any other status; cannot read, update, or
  delete any enquiry; cannot read, insert, update, or delete an
  `enquiry_notes` row. A raw `INSERT ... RETURNING` as anonymous correctly
  still fails too — the exact mechanism `submit_enquiry()` exists to work
  around, re-confirmed here rather than only reasoned about.
- **EDITOR** (any staff) can read every enquiry, change its status, and add
  an internal note — but cannot delete an enquiry (0 rows affected, not an
  error).
- **ADMIN** can do everything EDITOR can, and deleting an enquiry both
  succeeds and genuinely persists (confirmed by a follow-up count as
  superuser).

That verification setup is local-only scaffolding and isn't part of this
repo or its history, same as Phases 2–5.

**One thing this sandbox genuinely cannot verify**: whether supabase-js's
`error.message` on the client reads back *exactly* the text each `RAISE
EXCEPTION` in `submit_enquiry()`/`check_thursday_capacity()` raises (e.g.
"This Thursday is fully booked — please choose another date."). Everything
on the Postgres side — that the right exception fires at the right time,
with the right text, as the right role — is fully verified above. The final
hop (PostgREST's error passthrough into `PostgrestError.message`, which
`Consultation.tsx` shows the patient verbatim) is documented Supabase
behavior, not something this local-only setup, with no reachable live
Supabase project, can independently confirm.

## 14–16. Local dev, production build & deployment, security

Documented as each remaining phase lands.

## Project Structure

```
src/
  components/
    ui/        reusable primitives — Button, Container, Logo, Field,
               Textarea, Select, Toggle
    public/    public-site components (Phase 4) — DataState, PageHero,
               SectionHeading, ProcedureCard, PostCard, TestimonialCard,
               FaqAccordion, ConsultationCta
    admin/     admin-specific components (Phase 5) — AdminDataTable,
               AdminFormShell/FormSection, RepeatableList, ConfirmDialog,
               ImageUploadField, RichTextEditor, StatusBadge
               (+ EnquiryStatusBadge, Phase 6), StaffSection,
               PracticeLocationsSection
  hooks/
    useSupabaseQuery.ts     loading/error/data state for any Supabase
                            call, with a native refetch()
    useSupabaseMutation.ts  loading/error state for a single write
    usePageMeta.ts          sets <title> + meta description per page
  layouts/
    PublicLayout.tsx
    AdminLayout.tsx
  lib/
    supabase/
      client.ts       typed Supabase client (reads VITE_SUPABASE_* env vars)
      queries.ts       every public-facing query (Phase 4) — published only
      adminQueries.ts  every staff-side read (Phase 5/6) — all rows, RLS-gated
      mutations.ts     every staff-side write (Phase 5/6), each logged via audit.ts
      audit.ts         best-effort audit_logs insert after a mutation
      upload.ts         Storage upload + media_assets registry insert
      enquiry.ts        submit_enquiry() / get_thursday_availability() RPC
                        wrappers (Phase 6) — the public form's only writes
    format.ts    ZAR currency / date formatting
    sanitize.ts  DOMPurify wrapper for rendered post HTML
    slug.ts      slugify() for auto-generated slugs
    dates.ts     local-timezone-safe date helpers (Phase 6) — never
                 toISOString(), which can silently shift a date by a day
  pages/
    public/  Home, About, Procedures, ProcedureDetail,
             ReconstructiveSurgery, Resources, ArticleDetail, Gallery,
             Testimonials, Faq, Contact (Phase 4), Consultation (Phase 6)
    admin/   Dashboard, WebsiteContent, About, Settings, and a
             List+Form pair per entity — procedures/, resources/,
             Gallery*, Testimonials*, Faqs* (Phase 5), enquiries/ (Phase 6)
    auth/    Login, ForgotPassword, ResetPassword, shared AuthPageShell
  features/
    auth/   AuthProvider, useAuth, ProtectedRoute
    toast/  ToastProvider, useToast — save feedback across every admin form
  types/
    database.types.ts  generated from the schema — regenerate with `npm run db:types`
                       (hand-patched this phase for submit_enquiry() — see
                       its own comment in the file; this sandbox has no
                       reachable live project to regenerate against)
    content.ts          hand-written Row-shape aliases + join types
supabase/
  config.toml
  migrations/  16 migrations — see README §7
```
