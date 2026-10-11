import { useState } from "react";
import { Facebook, Twitter, MessageCircle, Link2, Check } from "lucide-react";
import { useToast } from "@/features/toast/useToast";

/** Real outbound share links for the current article — no share API dependency, works everywhere a plain <a> works. */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.show("success", "Link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.show("error", "Couldn't copy the link — copy it from the address bar instead.");
    }
  }

  const iconLinkClasses =
    "flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-light transition-colors hover:border-teal hover:text-teal-dark";

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted">Share</span>

      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
        className={iconLinkClasses}
      >
        <MessageCircle size={16} />
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        title="Share on Facebook"
        className={iconLinkClasses}
      >
        <Facebook size={16} />
      </a>

      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (Twitter)"
        title="Share on X (Twitter)"
        className={iconLinkClasses}
      >
        <Twitter size={16} />
      </a>

      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        title="Copy link"
        className={iconLinkClasses}
      >
        {copied ? <Check size={16} className="text-teal-dark" /> : <Link2 size={16} />}
      </button>
    </div>
  );
}
