import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { DataState } from "@/components/public/DataState";
import { SectionHeading } from "@/components/public/SectionHeading";
import { ProcedureCard } from "@/components/public/ProcedureCard";
import { TestimonialCard } from "@/components/public/TestimonialCard";
import { ConsultationCta } from "@/components/public/ConsultationCta";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import {
  getAboutContent,
  getFeaturedProcedures,
  getFeaturedTestimonials,
  getHomepageContent,
  getSiteSettings,
} from "@/lib/supabase/queries";
import { parsePatientJourney } from "@/types/content";
import type { HomepageContent, AboutContent, Procedure, ProcedureCategory, Testimonial, SiteSettings } from "@/types/content";
import { formatZAR } from "@/lib/format";

type HomeData = {
  homepage: HomepageContent;
  about: AboutContent | null;
  procedures: (Procedure & { procedure_categories: Pick<ProcedureCategory, "id" | "name" | "slug"> | null })[];
  testimonials: Testimonial[];
  settings: SiteSettings | null;
};

async function loadHome() {
  const [homepage, about, procedures, testimonials, settings] = await Promise.all([
    getHomepageContent(),
    getAboutContent(),
    getFeaturedProcedures(3),
    getFeaturedTestimonials(3),
    getSiteSettings(),
  ]);

  if (homepage.error || !homepage.data) {
    return { data: null, error: homepage.error ?? new Error("Homepage content not found") };
  }

  return {
    data: {
      homepage: homepage.data,
      about: about.data,
      procedures: procedures.data ?? [],
      testimonials: testimonials.data ?? [],
      settings: settings.data,
    } satisfies HomeData,
    error: null,
  };
}

export function Home() {
  usePageMeta(null, null); // root page keeps the plain site title/description
  const { data, loading, error } = useSupabaseQuery<HomeData>(loadHome, []);

  return (
    <DataState loading={loading} error={error}>
      {data && <HomeContent data={data} />}
    </DataState>
  );
}

function HomeContent({ data }: { data: HomeData }) {
  const { homepage, about, procedures, testimonials, settings } = data;
  const journey = parsePatientJourney(homepage.patient_journey);
  const cashFee = formatZAR(settings?.consultation_fee_cash);
  const medicalAidFee = formatZAR(settings?.consultation_fee_medical_aid);

  return (
    <>
      {/* Hero — §4 */}
      <div className="border-b border-line bg-cream">
        <Container className="grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            {homepage.hero_kicker && (
              <p className="text-sm font-semibold uppercase tracking-wider text-teal">
                {homepage.hero_kicker}
              </p>
            )}
            <h1 className="mt-3 text-4xl md:text-5xl">{homepage.hero_title}</h1>
            {homepage.hero_text && (
              <p className="mt-5 max-w-lg text-lg text-muted">{homepage.hero_text}</p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {homepage.hero_cta_primary_label && (
                <Link
                  to={homepage.hero_cta_primary_url ?? "/consultation"}
                  className={buttonClasses("primary")}
                >
                  {homepage.hero_cta_primary_label}
                </Link>
              )}
              {homepage.hero_cta_secondary_label && (
                <Link
                  to={homepage.hero_cta_secondary_url ?? "/about"}
                  className={buttonClasses("secondary")}
                >
                  {homepage.hero_cta_secondary_label}
                </Link>
              )}
            </div>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-sm bg-mist">
            {homepage.hero_image_url && (
              <img src={homepage.hero_image_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        </Container>
      </div>

      {/* Intro — §5, links through to the About page */}
      {(homepage.intro_heading || homepage.intro_text) && (
        <Container className="py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="aspect-square overflow-hidden rounded-sm bg-mist/60 md:order-2">
              {about?.profile_image_url && (
                <img
                  src={about.profile_image_url}
                  alt={about.full_name ?? ""}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="md:order-1">
              <SectionHeading title={homepage.intro_heading ?? ""} text={homepage.intro_text} />
              {about?.professional_title && (
                <p className="mt-4 text-sm font-medium text-teal">{about.professional_title}</p>
              )}
              <Link
                to="/about"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal"
              >
                More about Dr Nogaga <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Container>
      )}

      {/* Reconstructive surgery highlight — §4, dedicated emphasis beyond the procedures list */}
      {(homepage.reconstructive_heading || homepage.reconstructive_text) && (
        <div className="bg-ink-light/[0.03]">
          <Container className="py-16 md:py-20">
            <SectionHeading
              kicker="Reconstructive Surgery"
              title={homepage.reconstructive_heading ?? ""}
              text={homepage.reconstructive_text}
            />
            <Link
              to="/reconstructive-surgery"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal"
            >
              Learn about reconstructive surgery <ArrowRight size={14} />
            </Link>
          </Container>
        </div>
      )}

      {/* Patient journey — §4 */}
      {journey.length > 0 && (
        <Container className="py-16 md:py-20">
          <SectionHeading kicker="What to expect" title="Your journey with the practice" align="center" />
          <ol className="mt-10 grid gap-8 md:grid-cols-5">
            {journey.map((step, i) => (
              <li key={step.title} className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-sm font-semibold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
          {(cashFee || medicalAidFee) && (
            <p className="mt-10 flex flex-wrap items-center gap-2 text-sm text-muted">
              <CheckCircle2 size={16} className="text-teal" aria-hidden />
              Consultation fees:
              {medicalAidFee && <span className="font-medium text-ink">{medicalAidFee} (medical aid)</span>}
              {medicalAidFee && cashFee && <span>·</span>}
              {cashFee && <span className="font-medium text-ink">{cashFee} (cash)</span>}
            </p>
          )}
        </Container>
      )}

      {/* Featured procedures */}
      {procedures.length > 0 && (
        <div className="bg-cream">
          <Container className="py-16 md:py-20">
            <SectionHeading kicker="Services" title="Featured procedures" align="center" />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {procedures.map((procedure) => (
                <ProcedureCard key={procedure.id} procedure={procedure} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link to="/procedures" className={buttonClasses("secondary")}>
                View all procedures
              </Link>
            </div>
          </Container>
        </div>
      )}

      {/* Featured testimonials — omitted entirely while none are published
          (the seeded demo testimonial stays DRAFT; see seed_data.sql), so
          the homepage never shows a "coming soon" gap where real praise
          will eventually sit. */}
      {testimonials.length > 0 && (
        <Container className="py-16 md:py-20">
          <SectionHeading kicker="Patient stories" title="What patients say" align="center" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        </Container>
      )}

      <ConsultationCta
        heading={homepage.consultation_cta_heading}
        text={homepage.consultation_cta_text}
      />
    </>
  );
}
