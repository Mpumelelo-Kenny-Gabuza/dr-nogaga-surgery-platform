import DOMPurify from "dompurify";

/**
 * Sanitizes a post's content_html before it's ever handed to
 * dangerouslySetInnerHTML. The blog migration's own comment is explicit that
 * this column must never be trusted just because it came from an
 * authenticated staff user — sanitizing again here, at render time, is
 * defense-in-depth independent of whatever the Phase 5/7 editor does on the
 * way in.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "h2", "h3", "h4", "blockquote", "img", "figure", "figcaption", "hr",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title"],
  });
}
