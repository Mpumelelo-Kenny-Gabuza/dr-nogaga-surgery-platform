import { PageHero } from "@/components/public/PageHero";
import { Container } from "@/components/ui/Container";
import { DataState } from "@/components/public/DataState";
import { TestimonialCard } from "@/components/public/TestimonialCard";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAllTestimonials } from "@/lib/supabase/queries";
import type { Testimonial } from "@/types/content";

export function Testimonials() {
  usePageMeta("Testimonials", "What patients say about the practice.");
  const { data, loading, error } = useSupabaseQuery<Testimonial[]>(
    async () => {
      const { data, error } = await getAllTestimonials();
      return { data: data ?? [], error };
    },
    []
  );

  return (
    <>
      <PageHero kicker="Patient Stories" title="Testimonials" />
      <Container className="py-16 md:py-20">
        <DataState
          loading={loading}
          error={error}
          isEmpty={!loading && !error && (data?.length ?? 0) === 0}
          emptyMessage="Patient testimonials will be published here once approved by the practice."
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        </DataState>
      </Container>
    </>
  );
}
