# Handover: moving the site to the practice's own Supabase and Vercel

The practice owns its data. This is the runbook for moving everything from the
developer's Supabase/Vercel into the practice's accounts, then leaving nothing
behind in the developer's.

**The migration files carry the structure, not the contents.** What moves, and how:

| What | How it moves |
|---|---|
| Tables, RLS policies, functions, triggers, the 4 storage buckets + their policies, realtime, **seed content** | The SQL migrations → `npm run db:push` against the new project (Step 2) |
| Content edited in the CMS since seeding, **uploaded image files**, and the image URLs stored in rows (they contain the old project's address) | `scripts/migrate-content.mjs` (Step 3) |
| Staff logins | **Not copied.** The practice gets fresh accounts (Step 4) |
| Enquiries, comments, likes, audit log | **Not copied** — test/visitor data stays behind. If any enquiry is *real* patient data, stop and decide deliberately; don't just drop it |
| Auth settings (sign-up switch, Site URL, redirect URLs) | By hand in the dashboard (Steps 1 and 6) |
| API keys → Vercel environment variables | By hand (Step 5) |

## Before you start

- **Be invited, don't borrow the owner's login.** Ask the practice to invite your
  email as a member of their Supabase organisation and their Vercel team. Same
  access, but it works with their 2-factor, is traceable, and is easy to remove
  when you're done.
- **Plans.** Supabase *Free* projects are paused after about 7 days of low activity
  ([docs](https://supabase.com/docs/guides/platform/free-project-pausing)); paid projects aren't
  auto-paused — a live practice site shouldn't go offline for being quiet. Vercel
  *Hobby* is restricted to non-commercial use
  ([fair use](https://vercel.com/docs/limits/fair-use-guidelines)), so a practice website needs Pro.
  Both are the practice's decisions to make.
- **Don't launch yet.** Until Phase 8 (security pass) is applied, treat the new site
  as a staging site: test enquiries only, link not shared.

## Step 1 — Lock the new Supabase project (before anything else)

Dashboard → **Authentication → Sign In / Providers** → turn **off** "Allow new users to sign up".
(Menu labels move around; it's the switch with that wording.)

Why first: with the current schema every new sign-up becomes an *active staff
member* who can read patient enquiries, and the public anon key sits in the site's
JavaScript. Staff are created by an admin instead (Step 4).

## Step 2 — Push the schema to the new project

```powershell
npx supabase login
npx supabase projects list          # find the new project; copy its Reference ID
npx supabase link --project-ref <NEW_REF>
npx supabase projects list          # re-run: the ● LINKED marker must now be on the NEW project
npm run db:push
```

- `link` **replaces** your link to your own project, and `db:push` pushes to
  whichever project is linked. Check the marker before pushing.
- It asks for the database password set when the project was created. If nobody
  has it: Project Settings → Database → Reset database password.

Check it worked — SQL Editor in the **new** project (all read-only):

```sql
select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;   -- expect: 0 rows
select id, public from storage.buckets order by id;                         -- expect: 4 rows
select (select count(*) from public.procedures) as procedures,
       (select count(*) from public.practice_locations) as locations;       -- expect: 15 and 3
select tablename from pg_publication_tables where pubname = 'supabase_realtime'; -- expect: enquiries
```

## Step 3 — Copy your content and images

Skipping is only safe if you never edited content or uploaded an image in your
Supabase. Running it is harmless either way: it never writes to the old project,
and it can be re-run.

1. Create `.env.migrate.local` in the project root (already git-ignored — it matches
   `.env.*.local`):

   ```
   OLD_SUPABASE_URL=https://<old-ref>.supabase.co
   OLD_SUPABASE_SERVICE_KEY=<old project: secret / service_role key>
   NEW_SUPABASE_URL=https://<new-ref>.supabase.co
   NEW_SUPABASE_SERVICE_KEY=<new project: secret / service_role key>
   ```

   Project URL: Project Settings → Data API (or the **Connect** button). Service key:
   Project Settings → API Keys → the **secret** key (`sb_secret_…`), or `service_role` on the
   *Legacy* tab. These keys bypass every security rule — never commit them or paste them
   into a chat, and delete the file when finished.

2. **Dry run** (read-only; writes nothing anywhere):

   ```powershell
   node scripts/migrate-content.mjs --env-file .env.migrate.local
   ```

   Read the report: row counts per table, file counts per bucket, where image links
   point, and what is *not* copied (enquiries, comments, accounts). Check the line
   marked "← the old project" appears if you have any images.

3. **Apply**, typing the *practice's* project ref (the part of its URL before
   `.supabase.co`) yourself:

   ```powershell
   node scripts/migrate-content.mjs --env-file .env.migrate.local --apply --confirm-target <NEW_REF>
   ```

   It copies files first, replaces the new project's seed content with yours, rewrites
   every old-project image URL, then verifies against the new project: row counts, every
   file present with the same size, and every image link in the content actually loads.
   `All checks passed` means done. Exit code 2 lists the problems; fix and re-run.

   It refuses to run if the target already holds enquiries (a project in use), if
   the two projects are the same, or if `--confirm-target` doesn't match.

4. Delete `.env.migrate.local`.

Blog posts and media arrive with their author cleared (staff accounts aren't copied) —
Step 4 re-attributes them.

## Step 4 — Create the practice's logins

Authentication → **Users → Add user → Create new user**: their email + password, tick
**Auto Confirm User**. Then in the SQL Editor:

```sql
-- make the practice owner the first ADMIN (this also names the byline on blog posts)
update public.profiles set role = 'ADMIN', full_name = 'Dr Viwe Nogaga'
 where id = (select id from auth.users where email = '<their email>');

-- re-attribute posts that arrived without an author
update public.posts
   set author_id = (select id from auth.users where email = '<their email>')
 where author_id is null;
```

Whether you keep an account of your own is the practice's call; if so, create it the
same way as an EDITOR, and remove it when your work is done (Settings → Staff).

## Step 5 — Vercel

1. The code needs a Git repository Vercel can import. For "exclusively theirs", have the
   practice create a GitHub account/organisation and an empty repository, then from your clone:
   `git remote add practice https://github.com/<practice>/<repo>.git` and
   `git push practice main`. (Without GitHub: `npx vercel --prod` from your machine,
   logged in to the practice's Vercel team.)
2. Vercel → **Add New → Project** → import it. Vite is auto-detected; leave build
   `npm run build` and output `dist`. `vercel.json` already handles the SPA routing.
3. **Environment Variables** (Production and Preview):

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | the new project's URL |
   | `VITE_SUPABASE_ANON_KEY` | the new project's **publishable** key (`sb_publishable_…`), or the legacy `anon` key |

   Only these two. **Never the secret/service_role key** — it would be public in the site's JavaScript.
4. Deploy. `VITE_` values are baked in at build time, so after changing one you must **Redeploy**.

## Step 6 — Tell Supabase where the site lives

Authentication → **URL Configuration**: set **Site URL** to the site's address
(`https://<project>.vercel.app`, or the practice's own domain) and add it under **Redirect URLs**
(also `http://localhost:5173` for development). The staff "forgot password" email redirects to
`/admin/reset-password`; if that address isn't on the list, Supabase silently sends people
somewhere else and the reset breaks.

## Step 7 — Smoke test

- Home page loads with the real content and images. In DevTools → Network, no request goes to the **old** project's address.
- `/admin` signs in with the practice admin's login and the dashboard loads.
- Submit a test enquiry on `/consultation`: it appears in `/admin/enquiries` (with the sound alert). Delete it.
- Upload an image in a CMS form; it appears on the public site.
- **Sign-up is really closed** (PowerShell). This must fail with a 4xx error; if it *succeeds*, Step 1 wasn't saved — delete the test user in the dashboard and fix it:

  ```powershell
  Invoke-RestMethod -Method Post -Uri "https://<new-ref>.supabase.co/auth/v1/signup" `
    -Headers @{ apikey = "<publishable or anon key>" } -ContentType "application/json" `
    -Body '{"email":"signup-test@example.com","password":"Test-1234-abcd"}'
  ```
- **Visitors can't read enquiries**: this should print `[]`:

  ```powershell
  Invoke-RestMethod -Uri "https://<new-ref>.supabase.co/rest/v1/enquiries?select=id" `
    -Headers @{ apikey = "<publishable or anon key>" }
  ```

## Step 8 — Cut over and clean up

1. Once the practice has signed off, point your local `.env` at a **development** project, not the
   practice's live one. A fresh project built from `supabase/migrations/` works; never develop
   against live patient data, and remember `db:push` goes to whichever project is linked.
2. Delete your old Supabase project (Project Settings → General) and its Vercel deployment, so no copy
   of the practice's content stays in your accounts. Until then it's your rollback: nothing in it was changed.
3. Delete `.env.migrate.local`, and rotate or remove any key or password that was shared in a message.

## If something goes wrong

- The script never writes to the old project, so the original site keeps working throughout.
- A failure part-way through `--apply` can leave the new project half-filled; fix the cause and run the
  same command again — each run replaces the new project's content tables from scratch.
- `Could not read the TARGET project … does not exist` means Step 2 hasn't been run on that project.
