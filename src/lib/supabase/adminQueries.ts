// ============================================================================
// Admin-side reads — unlike queries.ts (the public site), these intentionally
// return every row regardless of status/published, because staff need to
// see and edit drafts. This is safe only because these calls run as an
// authenticated staff session: the RLS policies in migration 20260930090800
// grant "is_staff()" full SELECT on every one of these tables — an
// unauthenticated visitor making the exact same call gets only the
// published subset, enforced by Postgres, not by this file choosing to
// filter. Nothing here is the security boundary.
// ============================================================================
import { supabase } from "@/lib/supabase/client";

export function getAllProcedures() {
  return supabase
    .from("procedures")
    .select("*, procedure_categories(id, name, slug)")
    .order("display_order");
}

export function getProcedureById(id: string) {
  return supabase
    .from("procedures")
    .select("*, procedure_categories(id, name, slug)")
    .eq("id", id)
    .single();
}

export function getProcedureFaqIds(procedureId: string) {
  return supabase.from("procedure_faqs").select("faq_id").eq("procedure_id", procedureId);
}

export function getAllPosts() {
  return supabase
    .from("posts")
    .select("*, post_categories(id, name, slug), profiles(id, full_name)")
    .order("created_at", { ascending: false });
}

export function getPostById(id: string) {
  return supabase
    .from("posts")
    .select("*, post_categories(id, name, slug), profiles(id, full_name)")
    .eq("id", id)
    .single();
}

export function getPostTagNames(postId: string) {
  return supabase.from("post_tags_map").select("post_tags(name)").eq("post_id", postId);
}

export function getPostCategories() {
  return supabase.from("post_categories").select("*").order("display_order");
}

export function getAllGalleryItems() {
  return supabase.from("gallery_items").select("*").order("display_order");
}

export function getGalleryItemById(id: string) {
  return supabase.from("gallery_items").select("*").eq("id", id).single();
}

export function getAllTestimonials() {
  return supabase
    .from("testimonials")
    .select("*, procedures(id, title)")
    .order("display_order");
}

export function getTestimonialById(id: string) {
  return supabase.from("testimonials").select("*").eq("id", id).single();
}

export function getAllFaqs() {
  return supabase.from("faqs").select("*").order("display_order");
}

export function getFaqById(id: string) {
  return supabase.from("faqs").select("*").eq("id", id).single();
}

export function getAllTeamMembers() {
  return supabase.from("team_members").select("*").order("display_order");
}

export function getTeamMemberById(id: string) {
  return supabase.from("team_members").select("*").eq("id", id).single();
}

export function getAllPracticeLocations() {
  return supabase.from("practice_locations").select("*").order("display_order");
}

export function getAllSocialLinks() {
  return supabase.from("social_links").select("*").order("display_order");
}

export function getAllProfiles() {
  return supabase.from("profiles").select("*").order("created_at");
}

export function getRecentAuditLogs(limit = 20) {
  return supabase
    .from("audit_logs")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
}
