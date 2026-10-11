import { useParams, Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { DataState } from "@/components/public/DataState";
import { LikeButton } from "@/components/public/LikeButton";
import { ShareButtons } from "@/components/public/ShareButtons";
import { CommentSection } from "@/components/public/CommentSection";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getApprovedComments, getPostBySlug, getPostTags } from "@/lib/supabase/queries";
import { formatDate } from "@/lib/format";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Comment, PostWithRelations } from "@/types/content";

type ArticleData = {
  post: PostWithRelations;
  tags: { id: string; name: string; slug: string }[];
  comments: Comment[];
};

async function loadArticle(slug: string) {
  const { data: post, error } = await getPostBySlug(slug);
  if (error || !post) return { data: null, error };

  const [{ data: tagLinks }, { data: comments, error: commentsError }] = await Promise.all([
    getPostTags(post.id),
    getApprovedComments(post.id),
  ]);
  const tags = (tagLinks ?? [])
    .map((link) => link.post_tags)
    .filter((t): t is { id: string; name: string; slug: string } => Boolean(t));

  return {
    data: {
      post: post as PostWithRelations,
      tags,
      comments: comments ?? [],
    } satisfies ArticleData,
    error: commentsError,
  };
}

export function ArticleDetail() {
  const { slug = "" } = useParams();
  const { data, loading, error } = useSupabaseQuery<ArticleData>(() => loadArticle(slug), [slug]);

  usePageMeta(data?.post.seo_title ?? data?.post.title, data?.post.seo_description ?? data?.post.excerpt);

  if (!loading && !error && !data) {
    return (
      <Container className="flex flex-col items-start py-32">
        <p className="text-xs font-medium uppercase tracking-wider text-teal">Not found</p>
        <h1 className="mt-3 text-4xl">Article not found</h1>
        <p className="mt-4 max-w-md text-muted">
          This article may have been renamed or is no longer published.
        </p>
        <Link to="/resources" className={buttonClasses("primary", "mt-8")}>
          Back to Patient Resources
        </Link>
      </Container>
    );
  }

  return (
    <DataState loading={loading} error={error}>
      {data && <ArticleView data={data} />}
    </DataState>
  );
}

function ArticleView({ data }: { data: ArticleData }) {
  const { post, tags, comments } = data;
  const published = formatDate(post.published_at);
  const shareUrl = post.canonical_url || (typeof window !== "undefined" ? window.location.href : "");

  return (
    <article>
      <div className="border-b border-line bg-cream">
        <Container className="max-w-prose py-16 md:py-20">
          {post.post_categories && (
            <Link
              to="/resources"
              className="text-xs font-semibold uppercase tracking-wider text-teal"
            >
              {post.post_categories.name}
            </Link>
          )}
          <h1 className="mt-3 text-4xl md:text-5xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
            {post.profiles?.full_name && <span>By {post.profiles.full_name}</span>}
            {published && <span>· {published}</span>}
            {post.reading_time_minutes && <span>· {post.reading_time_minutes} min read</span>}
          </div>
        </Container>
      </div>

      <Container className="max-w-prose py-16 md:py-20">
        {post.featured_image_url && (
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="mb-10 w-full rounded-sm object-cover"
          />
        )}

        {post.content_html ? (
          <div
            className="prose-content leading-relaxed text-ink-light [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:text-ink [&_a]:text-teal [&_a]:underline [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5"
            // content_html is sanitized at render time regardless of what
            // the Phase 5/7 editor already enforced on the way in — see
            // src/lib/sanitize.ts.
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content_html) }}
          />
        ) : (
          post.excerpt && <p className="leading-relaxed text-ink-light">{post.excerpt}</p>
        )}

        {tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-line px-3 py-1 text-xs text-muted"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <LikeButton postId={post.id} />
          <ShareButtons url={shareUrl} title={post.title} />
        </div>

        <CommentSection postId={post.id} comments={comments} />
      </Container>
    </article>
  );
}
