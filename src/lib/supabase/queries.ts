// ============================================================================
// Phase 4 — every query the public site needs, in one place. Each function
// is a thin, typed wrapper around a single supabase-js call: no business
// logic here, just "what PUBLISHED/visible rows look like for this table",
// matching the RLS policies in migration 20260930090800 exactly. The
// policies are the real security boundary (spec §25) — the `.eq("status",
// "PUBLISHED")` filters below are for correct *ordering/shape* of what the
// database would return anyway, not a substitute for RLS.
// ============================================================================
import { supabase } from "@/lib/supabase/client";

// ----------------------------------------------------------------------------
// Singletons
// ----------------------------------------------------------------------------
export function getHomepageContent() {
  return supabase.from("homepage_content").select("*").eq("id", true).single();
}

export function getAboutContent() {
  return supabase.from("about_content").select("*").eq("id", true).single();
}

export function getSiteSettings() {
  return supabase.from("site_settings").select("*").eq("id", true).single();
}

// ----------------------------------------------------------------------------
// About page — qualifications, affiliations/memberships
// ----------------------------------------------------------------------------
export function getQualifications() {
  return supabase.from("about_qualifications").select("*").order("display_order");
}

export function getAffiliations() {
  return supabase.from("about_affiliations").select("*").order("display_order");
}

export function getTeamMembers() {
  // published=false by default (migration 20261002110000) — profiles are
  // pending from the practice, so this naturally returns [] until staff
  // publish real ones via the Phase 5 admin.
  return supabase
    .from("team_members")
    .select("*")
    .eq("published", true)
    .order("display_order");
}

// ----------------------------------------------------------------------------
// Procedures
// ----------------------------------------------------------------------------
export function getProcedureCategories() {
  return supabase.from("procedure_categories").select("*").order("display_order");
}

export function getPublishedProcedures() {
  return supabase
    .from("procedures")
    .select("*, procedure_categories(id, name, slug)")
    .eq("status", "PUBLISHED")
    .order("display_order");
}

export function getFeaturedProcedures(limit = 3) {
  return supabase
    .from("procedures")
    .select("*, procedure_categories(id, name, slug)")
    .eq("status", "PUBLISHED")
    .eq("is_featured", true)
    .order("display_order")
    .limit(limit);
}

export function getProceduresByCategorySlug(categorySlug: string) {
  return supabase
    .from("procedures")
    .select("*, procedure_categories!inner(id, name, slug)")
    .eq("status", "PUBLISHED")
    .eq("procedure_categories.slug", categorySlug)
    .order("display_order");
}

export function getProcedureBySlug(slug: string) {
  return supabase
    .from("procedures")
    .select("*, procedure_categories(id, name, slug)")
    .eq("status", "PUBLISHED")
    .eq("slug", slug)
    .single();
}

export function getProcedureImages(procedureId: string) {
  return supabase
    .from("procedure_images")
    .select("*")
    .eq("procedure_id", procedureId)
    .order("display_order");
}

/** FAQs linked to a procedure, filtered to the ones actually published. */
export function getProcedureFaqs(procedureId: string) {
  return supabase
    .from("procedure_faqs")
    .select("display_order, faqs!inner(id, question, answer, published)")
    .eq("procedure_id", procedureId)
    .eq("faqs.published", true)
    .order("display_order");
}

export function getTestimonialsByProcedure(procedureId: string) {
  return supabase
    .from("testimonials")
    .select("*")
    .eq("status", "PUBLISHED")
    .eq("procedure_id", procedureId)
    .order("display_order");
}

// ----------------------------------------------------------------------------
// Blog / Patient Resources
// ----------------------------------------------------------------------------
export function getPublishedPosts() {
  return supabase
    .from("posts")
    .select("*, post_categories(id, name, slug), profiles(id, full_name)")
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false });
}

export function getPostBySlug(slug: string) {
  return supabase
    .from("posts")
    .select("*, post_categories(id, name, slug), profiles(id, full_name)")
    .eq("status", "PUBLISHED")
    .eq("slug", slug)
    .single();
}

export function getPostTags(postId: string) {
  return supabase
    .from("post_tags_map")
    .select("post_tags(id, name, slug)")
    .eq("post_id", postId);
}

// ----------------------------------------------------------------------------
// Gallery / Testimonials / FAQs
// ----------------------------------------------------------------------------
export function getGalleryItems() {
  return supabase
    .from("gallery_items")
    .select("*")
    .eq("published", true)
    .order("display_order");
}

export function getFeaturedTestimonials(limit = 3) {
  return supabase
    .from("testimonials")
    .select("*")
    .eq("status", "PUBLISHED")
    .eq("is_featured", true)
    .order("display_order")
    .limit(limit);
}

export function getAllTestimonials() {
  return supabase
    .from("testimonials")
    .select("*")
    .eq("status", "PUBLISHED")
    .order("display_order");
}

export function getFaqs() {
  return supabase.from("faqs").select("*").eq("published", true).order("display_order");
}

// ----------------------------------------------------------------------------
// Contact / locations
// ----------------------------------------------------------------------------
export function getPracticeLocations() {
  return supabase
    .from("practice_locations")
    .select("*")
    .eq("published", true)
    .order("display_order");
}

export function getSocialLinks() {
  return supabase
    .from("social_links")
    .select("*")
    .eq("published", true)
    .order("display_order");
}
