import { PageHero } from "@/components/public/PageHero";
import { Container } from "@/components/ui/Container";
import { DataState } from "@/components/public/DataState";
import { ProcedureCard } from "@/components/public/ProcedureCard";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getProcedureCategories, getPublishedProcedures } from "@/lib/supabase/queries";
import type { ProcedureCategory, ProcedureWithCategory } from "@/types/content";

type ProceduresData = {
  categories: ProcedureCategory[];
  procedures: ProcedureWithCategory[];
};

async function loadProcedures() {
  const [categories, procedures] = await Promise.all([
    getProcedureCategories(),
    getPublishedProcedures(),
  ]);

  return {
    data: {
      categories: categories.data ?? [],
      procedures: (procedures.data ?? []) as ProcedureWithCategory[],
    } satisfies ProceduresData,
    error: categories.error ?? procedures.error ?? null,
  };
}

export function Procedures() {
  usePageMeta("Procedures", "Reconstructive, breast and aesthetic surgery procedures offered by the practice.");
  const { data, loading, error } = useSupabaseQuery<ProceduresData>(loadProcedures, []);

  return (
    <>
      <PageHero
        kicker="Services"
        title="Procedures"
        subtitle="An overview of the reconstructive, breast and aesthetic procedures offered by the practice."
      />
      <Container className="py-16 md:py-20">
        <DataState
          loading={loading}
          error={error}
          isEmpty={!loading && !error && (data?.procedures.length ?? 0) === 0}
          emptyMessage="Procedures will be published here soon."
        >
          {data && <ProceduresByCategory data={data} />}
        </DataState>
      </Container>
    </>
  );
}

function ProceduresByCategory({ data }: { data: ProceduresData }) {
  const { categories, procedures } = data;
  const grouped = categories
    .map((category) => ({
      category,
      items: procedures.filter((p) => p.procedure_categories?.id === category.id),
    }))
    .filter((group) => group.items.length > 0);

  const uncategorised = procedures.filter((p) => !p.procedure_categories);

  return (
    <div className="space-y-16">
      {grouped.map(({ category, items }) => (
        <section key={category.id}>
          <h2 className="text-2xl">{category.name}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((procedure) => (
              <ProcedureCard key={procedure.id} procedure={procedure} />
            ))}
          </div>
        </section>
      ))}

      {uncategorised.length > 0 && (
        <section>
          <h2 className="text-2xl">Other Procedures</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {uncategorised.map((procedure) => (
              <ProcedureCard key={procedure.id} procedure={procedure} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
