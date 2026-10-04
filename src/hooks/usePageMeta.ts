import { useEffect } from "react";

const SITE_NAME = "Dr Viwe Nogaga — Plastic & Reconstructive Surgeon";

function setMetaTag(name: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/**
 * Sets the document <title> and meta description for the current page.
 * Every public page calls this — it's what the seo_title/seo_description
 * columns on procedures/posts (and site_settings' seo_default_*) are for;
 * leaving them unused would make those real schema fields decorative.
 */
export function usePageMeta(title?: string | null, description?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    if (description) setMetaTag("description", description);
  }, [title, description]);
}
