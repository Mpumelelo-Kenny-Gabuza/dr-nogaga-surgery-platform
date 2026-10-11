// ============================================================================
// Every write the admin screens make, in one place — mirrors queries.ts.
// Each function is a thin wrapper: do the write, then log it to audit_logs
// (spec §27) so individual pages never have to remember to call logAction
// themselves. RLS (migration 20260930090800) is still the real boundary —
// these wrappers don't duplicate that logic, they just make sure a
// successful write is traceable to who made it.
// ============================================================================
import { supabase } from "@/lib/supabase/client";
import { logAction } from "@/lib/supabase/audit";
import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];

// ----------------------------------------------------------------------------
// Procedures
// ----------------------------------------------------------------------------
export async function createProcedure(values: Tables["procedures"]["Insert"]) {
  const { data, error } = await supabase.from("procedures").insert(values).select().single();
  if (data) await logAction("CREATE", "procedures", data.id, { title: data.title });
  return { data, error };
}

export async function updateProcedure(id: string, values: Tables["procedures"]["Update"]) {
  const { data, error } = await supabase
    .from("procedures")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (data) await logAction("UPDATE", "procedures", id, { title: data.title });
  return { data, error };
}

export async function deleteProcedure(id: string) {
  const { error } = await supabase.from("procedures").delete().eq("id", id);
  if (!error) await logAction("DELETE", "procedures", id);
  return { error };
}

export async function replaceProcedureImages(
  procedureId: string,
  images: { image_url: string; caption?: string | null; alt_text?: string | null }[]
) {
  // Simplest correct approach for a short, manually-ordered list: replace
  // the set wholesale rather than diffing inserts/updates/deletes.
  const { error: deleteError } = await supabase
    .from("procedure_images")
    .delete()
    .eq("procedure_id", procedureId);
  if (deleteError) return { error: deleteError };

  if (images.length === 0) return { error: null };

  const { error: insertError } = await supabase.from("procedure_images").insert(
    images.map((img, i) => ({
      procedure_id: procedureId,
      image_url: img.image_url,
      caption: img.caption ?? null,
      alt_text: img.alt_text ?? null,
      display_order: i,
    }))
  );
  if (!insertError) await logAction("UPDATE", "procedure_images", procedureId, { count: images.length });
  return { error: insertError };
}

export async function setProcedureFaqs(procedureId: string, faqIds: string[]) {
  const { error: deleteError } = await supabase
    .from("procedure_faqs")
    .delete()
    .eq("procedure_id", procedureId);
  if (deleteError) return { error: deleteError };

  if (faqIds.length === 0) return { error: null };

  const { error: insertError } = await supabase.from("procedure_faqs").insert(
    faqIds.map((faqId, i) => ({ procedure_id: procedureId, faq_id: faqId, display_order: i }))
  );
  return { error: insertError };
}

// ----------------------------------------------------------------------------
// Posts (blog / patient resources)
// ----------------------------------------------------------------------------
export async function createPost(values: Tables["posts"]["Insert"]) {
  const { data, error } = await supabase.from("posts").insert(values).select().single();
  if (data) await logAction("CREATE", "posts", data.id, { title: data.title });
  return { data, error };
}

export async function updatePost(id: string, values: Tables["posts"]["Update"]) {
  const { data, error } = await supabase.from("posts").update(values).eq("id", id).select().single();
  if (data) await logAction("UPDATE", "posts", id, { title: data.title });
  return { data, error };
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (!error) await logAction("DELETE", "posts", id);
  return { error };
}

/** Looks up or creates each tag by name, then replaces the post's tag set. */
export async function setPostTags(postId: string, tagNames: string[]) {
  const cleaned = Array.from(
    new Set(tagNames.map((t) => t.trim()).filter((t) => t.length > 0))
  );

  const tagIds: string[] = [];
  for (const name of cleaned) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: existing } = await supabase
      .from("post_tags")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      tagIds.push(existing.id);
    } else {
      const { data: created, error } = await supabase
        .from("post_tags")
        .insert({ name, slug })
        .select("id")
        .single();
      if (error) return { error };
      if (created) tagIds.push(created.id);
    }
  }

  const { error: deleteError } = await supabase.from("post_tags_map").delete().eq("post_id", postId);
  if (deleteError) return { error: deleteError };

  if (tagIds.length === 0) return { error: null };

  const { error: insertError } = await supabase
    .from("post_tags_map")
    .insert(tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));
  return { error: insertError };
}

// ----------------------------------------------------------------------------
// Gallery
// ----------------------------------------------------------------------------
export async function createGalleryItem(values: Tables["gallery_items"]["Insert"]) {
  const { data, error } = await supabase.from("gallery_items").insert(values).select().single();
  if (data) await logAction("CREATE", "gallery_items", data.id);
  return { data, error };
}

export async function updateGalleryItem(id: string, values: Tables["gallery_items"]["Update"]) {
  const { data, error } = await supabase
    .from("gallery_items")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (data) await logAction("UPDATE", "gallery_items", id);
  return { data, error };
}

export async function deleteGalleryItem(id: string) {
  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (!error) await logAction("DELETE", "gallery_items", id);
  return { error };
}

// ----------------------------------------------------------------------------
// Testimonials
// ----------------------------------------------------------------------------
export async function createTestimonial(values: Tables["testimonials"]["Insert"]) {
  const { data, error } = await supabase.from("testimonials").insert(values).select().single();
  if (data) await logAction("CREATE", "testimonials", data.id, { display_name: data.display_name });
  return { data, error };
}

export async function updateTestimonial(id: string, values: Tables["testimonials"]["Update"]) {
  const { data, error } = await supabase
    .from("testimonials")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (data) await logAction("UPDATE", "testimonials", id, { display_name: data.display_name });
  return { data, error };
}

export async function deleteTestimonial(id: string) {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (!error) await logAction("DELETE", "testimonials", id);
  return { error };
}

// ----------------------------------------------------------------------------
// FAQs
// ----------------------------------------------------------------------------
export async function createFaq(values: Tables["faqs"]["Insert"]) {
  const { data, error } = await supabase.from("faqs").insert(values).select().single();
  if (data) await logAction("CREATE", "faqs", data.id);
  return { data, error };
}

export async function updateFaq(id: string, values: Tables["faqs"]["Update"]) {
  const { data, error } = await supabase.from("faqs").update(values).eq("id", id).select().single();
  if (data) await logAction("UPDATE", "faqs", id);
  return { data, error };
}

export async function deleteFaq(id: string) {
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (!error) await logAction("DELETE", "faqs", id);
  return { error };
}

// ----------------------------------------------------------------------------
// Singletons — homepage_content / about_content / site_settings
// ----------------------------------------------------------------------------
export async function updateHomepageContent(values: Tables["homepage_content"]["Update"]) {
  const { data, error } = await supabase
    .from("homepage_content")
    .update(values)
    .eq("id", true)
    .select()
    .single();
  if (data) await logAction("UPDATE", "homepage_content", null);
  return { data, error };
}

export async function updateAboutContent(values: Tables["about_content"]["Update"]) {
  const { data, error } = await supabase
    .from("about_content")
    .update(values)
    .eq("id", true)
    .select()
    .single();
  if (data) await logAction("UPDATE", "about_content", null);
  return { data, error };
}

export async function updateSiteSettings(values: Tables["site_settings"]["Update"]) {
  const { data, error } = await supabase
    .from("site_settings")
    .update(values)
    .eq("id", true)
    .select()
    .single();
  if (data) await logAction("UPDATE", "site_settings", null);
  return { data, error };
}

// ----------------------------------------------------------------------------
// About page repeatable lists — qualifications / affiliations / team
// ----------------------------------------------------------------------------
export async function replaceQualifications(rows: Tables["about_qualifications"]["Insert"][]) {
  const { error: deleteError } = await supabase.from("about_qualifications").delete().neq(
    "id",
    "00000000-0000-0000-0000-000000000000"
  );
  if (deleteError) return { error: deleteError };
  if (rows.length === 0) return { error: null };
  const { error } = await supabase
    .from("about_qualifications")
    .insert(rows.map((r, i) => ({ ...r, display_order: i })));
  if (!error) await logAction("UPDATE", "about_qualifications", null, { count: rows.length });
  return { error };
}

export async function replaceAffiliations(rows: Tables["about_affiliations"]["Insert"][]) {
  const { error: deleteError } = await supabase.from("about_affiliations").delete().neq(
    "id",
    "00000000-0000-0000-0000-000000000000"
  );
  if (deleteError) return { error: deleteError };
  if (rows.length === 0) return { error: null };
  const { error } = await supabase
    .from("about_affiliations")
    .insert(rows.map((r, i) => ({ ...r, display_order: i })));
  if (!error) await logAction("UPDATE", "about_affiliations", null, { count: rows.length });
  return { error };
}

export async function replaceTeamMembers(rows: Tables["team_members"]["Insert"][]) {
  const { error: deleteError } = await supabase.from("team_members").delete().neq(
    "id",
    "00000000-0000-0000-0000-000000000000"
  );
  if (deleteError) return { error: deleteError };
  if (rows.length === 0) return { error: null };
  const { error } = await supabase
    .from("team_members")
    .insert(rows.map((r, i) => ({ ...r, display_order: i })));
  if (!error) await logAction("UPDATE", "team_members", null, { count: rows.length });
  return { error };
}

export async function createTeamMember(values: Tables["team_members"]["Insert"]) {
  const { data, error } = await supabase.from("team_members").insert(values).select().single();
  if (data) await logAction("CREATE", "team_members", data.id, { full_name: data.full_name });
  return { data, error };
}

export async function updateTeamMember(id: string, values: Tables["team_members"]["Update"]) {
  const { data, error } = await supabase
    .from("team_members")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (data) await logAction("UPDATE", "team_members", id, { full_name: data.full_name });
  return { data, error };
}

export async function deleteTeamMember(id: string) {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (!error) await logAction("DELETE", "team_members", id);
  return { error };
}

// ----------------------------------------------------------------------------
// Social links
// ----------------------------------------------------------------------------
export async function replaceSocialLinks(rows: Tables["social_links"]["Insert"][]) {
  const { error: deleteError } = await supabase.from("social_links").delete().neq(
    "id",
    "00000000-0000-0000-0000-000000000000"
  );
  if (deleteError) return { error: deleteError };
  if (rows.length === 0) return { error: null };
  const { error } = await supabase
    .from("social_links")
    .insert(rows.map((r, i) => ({ ...r, display_order: i })));
  if (!error) await logAction("UPDATE", "social_links", null, { count: rows.length });
  return { error };
}

// ----------------------------------------------------------------------------
// Practice locations
// ----------------------------------------------------------------------------
export async function createPracticeLocation(values: Tables["practice_locations"]["Insert"]) {
  const { data, error } = await supabase.from("practice_locations").insert(values).select().single();
  if (data) await logAction("CREATE", "practice_locations", data.id, { display_name: data.display_name });
  return { data, error };
}

export async function updatePracticeLocation(id: string, values: Tables["practice_locations"]["Update"]) {
  const { data, error } = await supabase
    .from("practice_locations")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (data) await logAction("UPDATE", "practice_locations", id, { display_name: data.display_name });
  return { data, error };
}

export async function deletePracticeLocation(id: string) {
  const { error } = await supabase.from("practice_locations").delete().eq("id", id);
  if (!error) await logAction("DELETE", "practice_locations", id);
  return { error };
}

// ----------------------------------------------------------------------------
// Staff profiles — role changes and activation, ADMIN-only per RLS.
// Creating a brand-new staff account is deliberately NOT here: that needs
// Supabase's admin API (a service-role call), which only belongs in a
// server-side Edge Function — none exists yet, so account creation stays a
// manual Supabase-dashboard step (see README "Creating the first ADMIN").
// This only ever touches a profiles row that already exists.
// ----------------------------------------------------------------------------
export async function updateProfileRole(id: string, role: Database["public"]["Enums"]["user_role"]) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select()
    .single();
  if (data) await logAction("UPDATE", "profiles", id, { role });
  return { data, error };
}

export async function setProfileActive(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();
  if (data) await logAction("UPDATE", "profiles", id, { is_active: isActive });
  return { data, error };
}

// ----------------------------------------------------------------------------
// Enquiries (Phase 6) — status changes and notes are any-staff per RLS
// ("staff update enquiry status" / "only staff may access enquiry notes");
// deleting the enquiry itself is ADMIN-only ("admins may delete an
// enquiry"). The UI hides the delete control for an EDITOR as a nicety
// (see EnquiryDetail.tsx) — this function doesn't duplicate that check,
// RLS is what actually enforces it.
// ----------------------------------------------------------------------------
export async function updateEnquiryStatus(
  id: string,
  status: Database["public"]["Enums"]["enquiry_status"]
) {
  const { data, error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", id)
    .select("*, practice_locations(id, display_name)")
    .single();
  if (data) await logAction("UPDATE", "enquiries", id, { status });
  return { data, error };
}

export async function deleteEnquiry(id: string) {
  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (!error) await logAction("DELETE", "enquiries", id);
  return { error };
}

export async function addEnquiryNote(enquiryId: string, note: string) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("enquiry_notes")
    .insert({ enquiry_id: enquiryId, note, author_id: userData.user?.id ?? null })
    .select("*, profiles(full_name)")
    .single();
  if (data) await logAction("CREATE", "enquiry_notes", data.id, { enquiry_id: enquiryId });
  return { data, error };
}

// ----------------------------------------------------------------------------
// Comments (Phase 7) — moderation is any-staff per RLS ("staff moderate
// comments" / "staff delete comments", both plain is_staff() checks, no
// ADMIN-only gate here the way enquiry deletion has one).
// ----------------------------------------------------------------------------
export async function updateCommentStatus(
  id: string,
  status: Database["public"]["Enums"]["comment_status"]
) {
  const { data, error } = await supabase
    .from("comments")
    .update({ status })
    .eq("id", id)
    .select("*, posts(id, title, slug)")
    .single();
  if (data) await logAction("UPDATE", "comments", id, { status });
  return { data, error };
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (!error) await logAction("DELETE", "comments", id);
  return { error };
}

/**
 * The only place in the app a comment is ever inserted as APPROVED
 * directly — "set APPROVED at insert time in the app layer since the
 * author is already an authenticated staff member" (the comments
 * migration's own header). Always a reply to the comment staff is
 * responding to, never a new top-level thread.
 */
export async function postPracticeReply(postId: string, parentCommentId: string, content: string) {
  const { data: userData } = await supabase.auth.getUser();
  const actor = userData.user;
  if (!actor) return { data: null, error: new Error("Not signed in.") };

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", actor.id)
    .single();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      parent_comment_id: parentCommentId,
      user_id: actor.id,
      name: profileData?.full_name || "Dr Nogaga's Practice",
      content,
      status: "APPROVED",
      is_practice_reply: true,
    })
    .select("*, posts(id, title, slug)")
    .single();
  if (data) await logAction("CREATE", "comments", data.id, { post_id: postId, is_practice_reply: true });
  return { data, error };
}
