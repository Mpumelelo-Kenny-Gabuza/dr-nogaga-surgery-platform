import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { Container } from "@/components/ui/Container";
import { DataState } from "@/components/public/DataState";
import { SocialLinks } from "@/components/public/SocialLinks";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getPracticeLocations, getSiteSettings, getSocialLinks } from "@/lib/supabase/queries";
import type { PracticeLocation, SiteSettings, SocialLink } from "@/types/content";

type ContactData = {
  settings: SiteSettings | null;
  locations: PracticeLocation[];
  socialLinks: SocialLink[];
};

async function loadContact() {
  const [settings, locations, socialLinks] = await Promise.all([
    getSiteSettings(),
    getPracticeLocations(),
    getSocialLinks(),
  ]);

  return {
    data: {
      settings: settings.data,
      locations: locations.data ?? [],
      socialLinks: socialLinks.data ?? [],
    } satisfies ContactData,
    error: locations.error ?? socialLinks.error ?? null,
  };
}

export function Contact() {
  usePageMeta("Contact", "Get in touch with the practice.");
  const { data, loading, error } = useSupabaseQuery<ContactData>(loadContact, []);

  return (
    <>
      <PageHero kicker="Contact" title="Get in Touch" subtitle="Reach out via phone, WhatsApp or email — or visit one of our locations." />
      <Container className="py-16 md:py-20">
        <DataState loading={loading} error={error}>
          {data && <ContactView data={data} />}
        </DataState>
      </Container>
    </>
  );
}

function ContactView({ data }: { data: ContactData }) {
  const { settings, locations, socialLinks } = data;

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-6">
        {settings?.contact_phone && (
          <ContactRow icon={Phone} label="Phone" value={settings.contact_phone} href={`tel:${settings.contact_phone}`} />
        )}
        {settings?.contact_whatsapp && (
          <ContactRow
            icon={MessageCircle}
            label="WhatsApp"
            value={settings.contact_whatsapp}
            href={`https://wa.me/${settings.contact_whatsapp.replace(/\D/g, "")}`}
          />
        )}
        {settings?.contact_email && (
          <ContactRow icon={Mail} label="Email" value={settings.contact_email} href={`mailto:${settings.contact_email}`} />
        )}
        {settings?.address && <ContactRow icon={MapPin} label="Address" value={settings.address} />}
        {settings?.operating_hours && (
          <div className="pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-teal">Operating Hours</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-muted">{settings.operating_hours}</p>
          </div>
        )}

        <SocialLinks
          links={socialLinks}
          className="pt-2"
          iconClassName="flex h-9 w-9 items-center justify-center rounded-full border border-line text-teal transition-colors hover:border-teal hover:bg-mist/40"
        />

        {settings?.map_embed_url && (
          <div className="overflow-hidden rounded-sm border border-line pt-4">
            <iframe
              src={settings.map_embed_url}
              title="Practice location map"
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl">Our Locations</h2>
        <div className="mt-6 space-y-6">
          {locations.length === 0 && (
            <p className="text-sm text-muted">Location details will be published here soon.</p>
          )}
          {locations.map((location) => (
            <div key={location.id} className="rounded-sm border border-line bg-white p-5">
              <h3 className="font-semibold text-ink">{location.display_name}</h3>
              {!location.is_physical && (
                <p className="mt-1 text-xs uppercase tracking-wide text-teal">Virtual consultation</p>
              )}
              {location.address && <p className="mt-2 text-sm text-muted">{location.address}</p>}
              <div className="mt-3 flex flex-col gap-1 text-sm">
                {location.landline && (
                  <a href={`tel:${location.landline}`} className="text-teal hover:underline">
                    {location.landline}
                  </a>
                )}
                {location.whatsapp && (
                  <a
                    href={`https://wa.me/${location.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal hover:underline"
                  >
                    WhatsApp: {location.whatsapp}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <Icon size={18} className="mt-0.5 text-teal" aria-hidden />
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <p className="text-ink">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:text-teal">
      {content}
    </a>
  ) : (
    content
  );
}
