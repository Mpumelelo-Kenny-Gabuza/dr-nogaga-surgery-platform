import { PageHero } from "@/components/public/PageHero";
import { Container } from "@/components/ui/Container";
import { DataState } from "@/components/public/DataState";
import { ProcedureCard } from "@/components/public/ProcedureCard";
import { ConsultationCta } from "@/components/public/ConsultationCta";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getHomepageContent, getProceduresByCategorySlug } from "@/lib/supabase/queries";
import type { HomepageContent, ProcedureWithCategory } from "@/types/content";

type ReconstructiveData = {
  homepage: HomepageContent | null;
  procedures: ProcedureWithCategory[];
};

async function loadReconstructive() {
  const [homepage, procedures] = await Promise.all([
    getHomepageContent(),
    getProceduresByCategorySlug("reconstructive-surgery"),
  ]);

  return {
    data: {
      homepage: homepage.data,
      procedures: (procedures.data ?? []) as ProcedureWithCategory[],
    } satisfies ReconstructiveData,
    error: procedures.error ?? null,
  };
}

// A dedicated page for reconstructive surgery, distinct from its listing
// under /procedures — the practice singled this out as a core emphasis
// (homepage_content.reconstructive_heading/text exist specifically for it).
export function ReconstructiveSurgery() {
  usePageMeta(
    "Reconstructive Surgery",
    "Reconstructive surgery following trauma, illness or congenital conditions — restoring function, confidence and quality of life."
  );
  const { data, loading, error } = useSupabaseQuery<ReconstructiveData>(loadReconstructive, []);

  return (
    <>
      <PageHero
        kicker="Reconstructive Surgery"
        title={data?.homepage?.reconstructive_heading ?? "Reconstructive Surgery"}
        subtitle={data?.homepage?.reconstructive_text}
      />

      <Container className="py-16 md:py-20">
        <DataState
          loading={loading}
          error={error}
          isEmpty={!loading && !error && (data?.procedures.length ?? 0) === 0}
          emptyMessage="Reconstructive surgery procedures will be published here soon."
        >
          {data && data.procedures.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.procedures.map((procedure) => (
                <ProcedureCard key={procedure.id} procedure={procedure} />
              ))}
            </div>
          )}
        </DataState>
      </Container>

      <ConsultationCta />
    </>
  );
}
