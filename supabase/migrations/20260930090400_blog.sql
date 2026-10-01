create table public.post_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.post_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.post_categories (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,

  title text not null,
  slug text not null unique,
  excerpt text,
  -- Rendered/sanitized HTML from the rich text editor (spec §33). Sanitize
  -- at the application layer before every insert/update — never trust this
  -- column to be safe just because it came from an authenticated staff user.
  content_html text,
  featured_image_url text,
  reading_time_minutes smallint,

  status public.content_status not null default 'DRAFT',
  is_featured boolean not null default false,
  published_at timestamptz,

  seo_title text,
  seo_description text,
  canonical_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_status_idx on public.posts (status);
create index posts_category_id_idx on public.posts (category_id);
create index posts_published_at_idx on public.posts (published_at desc);

create trigger set_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create table public.post_tags_map (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.post_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ============================================================================
-- post_likes — supports both signed-in and anonymous likes (spec §10)
-- ============================================================================
-- Anonymous likes are identified by a random key the frontend generates and
-- stores in localStorage (NOT auth — there's no account). This stops a
-- casual double-click but, being client-supplied, a determined visitor could
-- reset it and like again. That's an accepted, low-stakes tradeoff for a
-- "like" button; it is not used anywhere access-control-sensitive.
create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  anon_key text,
  created_at timestamptz not null default now(),

  constraint post_likes_owner_check check (
    (user_id is not null and anon_key is null) or
    (user_id is null and anon_key is not null)
  )
);

create unique index post_likes_unique_user
  on public.post_likes (post_id, user_id) where user_id is not null;

create unique index post_likes_unique_anon
  on public.post_likes (post_id, anon_key) where anon_key is not null;

create index post_likes_post_id_idx on public.post_likes (post_id);

-- ============================================================================
-- comments — threaded, moderated, supports official practice replies
-- ============================================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,

  name text not null,
  email text,
  content text not null,

  status public.comment_status not null default 'PENDING',
  -- True only for a staff reply, so the frontend can style it as an
  -- official response (spec §11 example). Staff replies are still subject
  -- to the same moderation table — set APPROVED at insert time in the app
  -- layer since the author is already an authenticated staff member.
  is_practice_reply boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments (post_id);
create index comments_status_idx on public.comments (status);
create index comments_parent_comment_id_idx on public.comments (parent_comment_id);

create trigger set_comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();
