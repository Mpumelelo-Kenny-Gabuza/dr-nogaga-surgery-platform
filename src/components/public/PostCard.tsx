import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { PostWithRelations } from "@/types/content";

export function PostCard({ post }: { post: PostWithRelations }) {
  const published = formatDate(post.published_at);

  return (
    <Link
      to={`/resources/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-sm border border-line bg-white transition-colors hover:border-teal"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-mist/40">
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wide text-muted">
            {post.post_categories?.name ?? "Patient Resource"}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-xs text-muted">
          {post.post_categories && (
            <span className="font-semibold uppercase tracking-wider text-teal">
              {post.post_categories.name}
            </span>
          )}
          {published && <span>{published}</span>}
          {post.reading_time_minutes && <span>· {post.reading_time_minutes} min read</span>}
        </div>
        <h3 className="mt-2 text-xl">{post.title}</h3>
        {post.excerpt && <p className="mt-2 flex-1 text-sm text-muted">{post.excerpt}</p>}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal">
          Read article <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
