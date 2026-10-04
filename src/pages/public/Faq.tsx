import { PageHero } from "@/components/public/PageHero";
import { Container } from "@/components/ui/Container";
import { DataState } from "@/components/public/DataState";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getFaqs } from "@/lib/supabase/queries";
import type { Faq as FaqRow } from "@/types/content";

export function Faq() {
  usePageMeta("Frequently Asked Questions", "Answers to common questions about procedures, consultations and recovery.");
  const { data, loading, error } = useSupabaseQuery<FaqRow[]>(
    async () => {
      const { data, error } = await getFaqs();
      return { data: data ?? [], error };
    },
    []
  );

  const grouped = Object.entries(
    (data ?? []).reduce<Record<string, FaqRow[]>>((acc, faq) => {
      const key = faq.category ?? "General";
      acc[key] = acc[key] ?? [];
      acc[key].push(faq);
      return acc;
    }, {})
  );

  return (
    <>
      <PageHero kicker="FAQ" title="Frequently Asked Questions" />
      <Container className="max-w-3xl py-16 md:py-20">
        <DataState
          loading={loading}
          error={error}
          isEmpty={!loading && !error && (data?.length ?? 0) === 0}
          emptyMessage="Frequently asked questions will be published here soon."
        >
          <div className="space-y-12">
            {grouped.map(([category, faqs]) => (
              <section key={category}>
                {grouped.length > 1 && <h2 className="mb-4 text-xl">{category}</h2>}
                <FaqAccordion faqs={faqs} />
              </section>
            ))}
          </div>
        </DataState>
      </Container>
    </>
  );
}
