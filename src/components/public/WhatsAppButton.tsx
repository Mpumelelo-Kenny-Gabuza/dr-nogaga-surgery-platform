import { MessageCircle } from "lucide-react";

/**
 * Site-wide floating WhatsApp button (per the practice's request). Renders
 * nothing if there's no real WhatsApp number yet — never a dead/placeholder
 * link, same "no fake functionality" rule every public page follows.
 * `whatsapp` should already be the practice's real number (site_settings.
 * contact_whatsapp, falling back to the first published location's own
 * number — see PublicLayout.tsx, the same fallback Contact.tsx/Footer use).
 */
export function WhatsAppButton({ whatsapp }: { whatsapp: string | null | undefined }) {
  if (!whatsapp) return null;

  const digits = whatsapp.replace(/\D/g, "");
  const message = encodeURIComponent(
    "Hi, I'd like to enquire about a consultation with Dr Nogaga."
  );

  return (
    <a
      href={`https://wa.me/${digits}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
    >
      <MessageCircle size={28} strokeWidth={2} aria-hidden />
      <span className="sr-only">Chat with us on WhatsApp</span>
    </a>
  );
}
