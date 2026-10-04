import { useParams, Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { DataState } from "@/components/public/DataState";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { TestimonialCard } from "@/components/public/TestimonialCard";
import { ConsultationCta } from "@/components/public/ConsultationCta";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import {
  getProcedureBySlug,
  getProcedureFaqs,
  getProcedureImages,
  getTestimonialsByProcedure,
} from "@/lib/supabase/queries";
import type { Faq, ProcedureImage, ProcedureWithCategory, Testimonial } from "@/types/content";

type ProcedureDetailData = {
  procedure: ProcedureWithCategory;
  images: ProcedureImage[];
  faqs: Pick<Faq, "id" | "question" | "answer">[];
  testimonials: Testimonial[];
};

async function loadProcedure(slug: string) {
  const { data: procedure, error } = await getProcedureBySlug(slug);
  if (error || !procedure) return { data: null, error };

  const [images, faqLinks, testimonials] = await Promise.all([
    getProcedureImages(procedure.id),
    getProcedureFaqs(procedure.id),
    getTestimonialsByProcedure(procedure.id),
  ]);

  const faqs = (faqLinks.data ?? [])
    .map((link) => link.faqs)
    .filter((f): f is { id: string; question: string; answer: string; published: boolean } => Boolean(f));

  return {
    data: {
      procedure: procedure as ProcedureWithCategory,
      images: images.data ?? [],
      faqs,
      testimonials: testimonials.data ?? [],
    } satisfies ProcedureDetailData,
    error: null,
  };
}

export function ProcedureDetail() {
  const { slug = "" } = useParams();
  const { data, loading, error } = useSupabaseQuery<ProcedureDetailData>(
    () => loadProcedure(slug),
    [slug]
  );

  usePageMeta(data?.procedure.seo_title ?? data?.procedure.title, data?.procedure.seo_description);

  if (!loading && !error && !data) {
    return (
      <Container className="flex flex-col items-start py-32">
        <p className="text-xs font-medium uppercase tracking-wider text-teal">Not found</p>
        <h1 className="mt-3 text-4xl">Procedure not found</h1>
        <p className="mt-4 max-w-md text-muted">
          This procedure may have been renamed or is no longer published.
        </p>
        <Link to="/procedures" className={buttonClasses("primary", "mt-8")}>
          View all procedures
        </Link>
      </Container>
    );
  }

  return (
    <DataState loading={loading} error={error}>
      {data && <ProcedureDetailView data={data} />}
    </DataState>
  );
}

function ProcedureDetailView({ data }: { data: ProcedureDetailData }) {
  const { procedure, images, faqs, testimonials } = data;

  return (
    <>
      <div className="border-b border-line bg-cream">
        <Container className="py-16 md:py-20">
          {procedure.procedure_categories && (
            <Link
              to="/procedures"
              className="text-xs font-semibold uppercase tracking-wider text-teal"
            >
              {procedure.procedure_categories.name}
            </Link>
          )}
          <h1 className="mt-3 max-w-2xl text-4xl md:text-5xl">{procedure.title}</h1>
          {procedure.short_description && (
            <p className="mt-4 max-w-2xl text-muted">{procedure.short_description}</p>
          )}
        </Container>
      </div>

      <Container className="grid gap-12 py-16 md:grid-cols-[2fr,1fr] md:py-20">
        <article className="max-w-prose space-y-8 leading-relaxed text-ink-light">
          {procedure.featured_image_url && (
            <img
              src={procedure.featured_image_url}
              alt={procedure.title}
              className="w-full rounded-sm object-cover"
            />
          )}

          {procedure.full_description && <p>{procedure.full_description}</p>}

          {procedure.patient_information && (
            <div>
              <h2 className="text-xl text-ink">Patient Information</h2>
              <p className="mt-3">{procedure.patient_information}</p>
            </div>
          )}

          {procedure.preparation_information && (
            <div>
              <h2 className="text-xl text-ink">Preparing for Your Procedure</h2>
              <p className="mt-3">{procedure.preparation_information}</p>
            </div>
          )}

          {procedure.recovery_information && (
            <div>
              <h2 className="text-xl text-ink">Recovery</h2>
              <p className="mt-3">{procedure.recovery_information}</p>
            </div>
          )}

          {images.length > 0 && (
            <div>
              <h2 className="text-xl text-ink">Gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {images.map((image) => (
                  <img
                    key={image.id}
                    src={image.image_url}
                    alt={image.alt_text ?? ""}
                    className="aspect-square rounded-sm object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          {procedure.risks_disclaimer && (
            <div className="rounded-sm border border-line bg-cream/60 p-5 text-sm">
              <h3 className="font-semibold text-ink">Risks &amp; Disclaimer</h3>
              <p className="mt-2 text-muted">{procedure.risks_disclaimer}</p>
            </div>
          )}
        </article>

        <aside>
          <div className="rounded-sm border border-line bg-white p-6">
            <h3 className="text-lg text-ink">Considering this procedure?</h3>
            <p className="mt-2 text-sm text-muted">
              Book a consultation to discuss whether this procedure is right for you.
            </p>
            <Link to="/consultation" className={buttonClasses("primary", "mt-4 w-full")}>
              Book a Consultation
            </Link>
          </div>
        </aside>
      </Container>

      {faqs.length > 0 && (
        <div className="border-t border-line bg-cream">
          <Container className="py-16 md:py-20">
            <h2 className="text-2xl">Frequently Asked Questions</h2>
            <div className="mt-6">
              <FaqAccordion faqs={faqs} />
            </div>
          </Container>
        </div>
      )}

      {testimonials.length > 0 && (
        <Container className="py-16 md:py-20">
          <h2 className="text-2xl">Patient Stories</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        </Container>
      )}

      <ConsultationCta />
    </>
  );
}
