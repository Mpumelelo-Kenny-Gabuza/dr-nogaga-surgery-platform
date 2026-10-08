import { Facebook, Instagram, Linkedin, Twitter, Youtube, Globe } from "lucide-react";

// social_links.platform is free text (set by staff in the admin — see
// WebsiteContent.tsx), not an enum, so there's nothing in the schema to
// switch on directly. This matches the common names staff would actually
// type to a recognizable icon; anything else still gets a real link, just
// with a generic globe icon instead of a blank one.
const ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
};

export function getSocialIcon(platform: string): typeof Facebook {
  return ICONS[platform.trim().toLowerCase()] ?? Globe;
}
