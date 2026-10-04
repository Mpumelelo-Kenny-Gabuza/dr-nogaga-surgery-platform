import { PageHero } from "@/components/public/PageHero";
import { Container } from "@/components/ui/Container";
import { DataState } from "@/components/public/DataState";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import {
  getAboutContent,
  getAffiliations,
  getQualifications,
  getTeamMembers,
} from "@/lib/supabase/queries";
import type { AboutAffiliation, AboutContent, AboutQualification, TeamMember } from "@/types/content";

type AboutData = {
  about: AboutContent | null;
  qualifications: AboutQualification[];
  affiliations: AboutAffiliation[];
  team: TeamMember[];
};

// Copy that only ever exists as an internal "not provided yet" marker
// (seeded in 20260930091000_seed_data.sql) should never reach a visitor
// verbatim — this renders a proper patient-facing sentence instead.
function isPending(text: string | null | undefined): boolean {
  return !text || /placeholder|to be (confirmed|provided)/i.test(text);
}

async function loadAbout() {
  const [about, qualifications, affiliations, team] = await Promise.all([
    getAboutContent(),
    getQualifications(),
    getAffiliations(),
    getTeamMembers(),
  ]);

  return {
    data: {
      about: about.data,
      qualifications: qualifications.data ?? [],
      affiliations: affiliations.data ?? [],
      team: team.data ?? [],
    } satisfies AboutData,
    error: qualifications.error ?? affiliations.error ?? team.error ?? null,
  };
}

export function About() {
  usePageMeta("About Dr Nogaga", "Qualifications, affiliations and approach to patient care.");
  const { data, loading, error } = useSupabaseQuery<AboutData>(loadAbout, []);

  return (
    <DataState loading={loading} error={error}>
      {data && <AboutContentView data={data} />}
    </DataState>
  );
}

function AboutContentView({ data }: { data: AboutData }) {
  const { about, qualifications, affiliations, team } = data;
  const memberships = affiliations.filter((a) => a.kind === "MEMBERSHIP");
  const otherAffiliations = affiliations.filter((a) => a.kind === "AFFILIATION");

  return (
    <>
      <PageHero
        kicker="About"
        title={about?.full_name ?? "Dr Viwe Nogaga"}
        subtitle={about?.professional_title}
      />

      <Container className="grid gap-12 py-16 md:grid-cols-[2fr,1fr] md:py-20">
        <div>
          <h2 className="text-2xl">Biography</h2>
          <p className="mt-4 max-w-prose leading-relaxed text-ink-light">
            {isPending(about?.biography)
              ? "A full biography is being finalised by the practice and will be published here soon."
              : about!.biography}
          </p>

          <h2 className="mt-12 text-2xl">Approach to Patient Care</h2>
          <p className="mt-4 max-w-prose leading-relaxed text-ink-light">
            {isPending(about?.approach_to_patient_care)
              ? "Details of Dr Nogaga's approach to patient care are being finalised by the practice and will be published here soon."
              : about!.approach_to_patient_care}
          </p>
        </div>

        <aside className="space-y-10">
          {qualifications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-teal">
                Qualifications
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-light">
                {qualifications.map((q) => (
                  <li key={q.id}>
                    <span className="font-medium text-ink">{q.title}</span>
                    {q.institution && <span className="text-muted"> — {q.institution}</span>}
                    {q.year_obtained && <span className="text-muted"> ({q.year_obtained})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {memberships.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-teal">
                Professional Memberships
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-light">
                {memberships.map((m) => (
                  <li key={m.id}>{m.name}</li>
                ))}
              </ul>
            </div>
          )}

          {otherAffiliations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-teal">
                Affiliations
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-light">
                {otherAffiliations.map((a) => (
                  <li key={a.id}>{a.name}</li>
                ))}
              </ul>
            </div>
          )}

          {qualifications.length === 0 && memberships.length === 0 && otherAffiliations.length === 0 && (
            <p className="text-sm text-muted">
              Qualifications and affiliations will be published here once confirmed by the practice.
            </p>
          )}
        </aside>
      </Container>

      {team.length > 0 && (
        <div className="border-t border-line bg-cream">
          <Container className="py-16 md:py-20">
            <h2 className="text-2xl">Meet the Team</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
              {team.map((member) => (
                <div key={member.id}>
                  <div className="aspect-square overflow-hidden rounded-sm bg-mist/60">
                    {member.photo_url && (
                      <img
                        src={member.photo_url}
                        alt={member.full_name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-ink">{member.full_name}</h3>
                  {member.role_title && <p className="text-sm text-teal">{member.role_title}</p>}
                  {member.bio && <p className="mt-2 text-sm text-muted">{member.bio}</p>}
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}
    </>
  );
}
