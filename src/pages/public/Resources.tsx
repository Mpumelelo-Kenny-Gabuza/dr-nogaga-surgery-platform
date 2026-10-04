import { PageHero } from "@/components/public/PageHero";
import { Container } from "@/components/ui/Container";
import { DataState } from "@/components/public/DataState";
import { PostCard } from "@/components/public/PostCard";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getPublishedPosts } from "@/lib/supabase/queries";
import type { PostWithRelations } from "@/types/content";

export function Resources() {
  usePageMeta("Patient Resources", "Educational articles and guides for patients.");
  const { data, loading, error } = useSupabaseQuery<PostWithRelations[]>(
    async () => {
      const { data, error } = await getPublishedPosts();
      return { data: (data ?? []) as PostWithRelations[], error };
    },
    []
  );

  return (
    <>
      <PageHero
        kicker="Patient Resources"
        title="Articles & Guides"
        subtitle="Educational content to help you understand procedures, recovery and what to expect."
      />
      <Container className="py-16 md:py-20">
        <DataState
          loading={loading}
          error={error}
          isEmpty={!loading && !error && (data?.length ?? 0) === 0}
          emptyMessage="Patient resources are being prepared and will be published here soon."
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </DataState>
      </Container>
    </>
  );
}
