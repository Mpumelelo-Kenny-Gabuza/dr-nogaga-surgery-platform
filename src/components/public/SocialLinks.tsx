import clsx from "clsx";
import { getSocialIcon } from "@/lib/socialIcons";
import type { SocialLink } from "@/types/content";

/**
 * Icon-only social links, shared by the site footer and the Contact page —
 * one place rendering real `social_links` rows (never a hardcoded
 * Facebook/Instagram pair), so an unpublished or not-yet-added platform
 * correctly shows nothing rather than a dead icon.
 */
export function SocialLinks({
  links,
  className,
  iconClassName,
}: {
  links: SocialLink[];
  className?: string;
  iconClassName?: string;
}) {
  if (links.length === 0) return null;

  return (
    <div className={clsx("flex items-center gap-3", className)}>
      {links.map((link) => {
        const Icon = getSocialIcon(link.platform);
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.platform}
            title={link.platform}
            className={iconClassName}
          >
            <Icon size={16} aria-hidden />
          </a>
        );
      })}
    </div>
  );
}
