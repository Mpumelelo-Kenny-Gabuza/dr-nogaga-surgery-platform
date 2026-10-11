import type { Database } from "@/types/database.types";

// Short aliases for the Row shapes the public pages read. Kept separate from
// database.types.ts (which is generated and must never be hand-edited) so
// these can be imported tersely everywhere else.
export type Procedure = Database["public"]["Tables"]["procedures"]["Row"];
export type ProcedureCategory = Database["public"]["Tables"]["procedure_categories"]["Row"];
export type ProcedureImage = Database["public"]["Tables"]["procedure_images"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostCategory = Database["public"]["Tables"]["post_categories"]["Row"];
export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
export type Faq = Database["public"]["Tables"]["faqs"]["Row"];
export type GalleryItem = Database["public"]["Tables"]["gallery_items"]["Row"];
export type PracticeLocation = Database["public"]["Tables"]["practice_locations"]["Row"];
export type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type AboutQualification = Database["public"]["Tables"]["about_qualifications"]["Row"];
export type AboutAffiliation = Database["public"]["Tables"]["about_affiliations"]["Row"];
export type HomepageContent = Database["public"]["Tables"]["homepage_content"]["Row"];
export type AboutContent = Database["public"]["Tables"]["about_content"]["Row"];
export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type Enquiry = Database["public"]["Tables"]["enquiries"]["Row"];
export type EnquiryNote = Database["public"]["Tables"]["enquiry_notes"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type PostLike = Database["public"]["Tables"]["post_likes"]["Row"];

export type ProcedureWithCategory = Procedure & {
  procedure_categories: Pick<ProcedureCategory, "id" | "name" | "slug"> | null;
};

export type PostWithRelations = Post & {
  post_categories: Pick<PostCategory, "id" | "name" | "slug"> | null;
  profiles: { id: string; full_name: string | null } | null;
};

export type TestimonialWithProcedure = Testimonial & {
  procedures: { id: string; title: string } | null;
};

export type AuditLogWithActor = AuditLog & {
  profiles: { full_name: string | null } | null;
};

export type EnquiryWithLocation = Enquiry & {
  practice_locations: Pick<PracticeLocation, "id" | "display_name"> | null;
};

export type EnquiryNoteWithAuthor = EnquiryNote & {
  profiles: { full_name: string | null } | null;
};

/**
 * A top-level comment with its replies already gathered under it (one
 * visual level, however deep parent_comment_id actually chains — see
 * CommentSection.tsx's groupThread for why that's a deliberate choice, not
 * a limitation of the schema itself).
 */
export type CommentWithReplies = Comment & { replies: Comment[] };

/** The admin moderation queue's shape — every comment is flat here, each tagged with which post it belongs to. */
export type CommentWithPost = Comment & {
  posts: { id: string; title: string; slug: string } | null;
};

/** One step of homepage_content.patient_journey (jsonb array). */
export type PatientJourneyStep = { title: string; text: string };

/**
 * homepage_content.patient_journey is stored as jsonb (typed `Json` by the
 * generator, which only promises "valid JSON", not this shape). This
 * validates it at the boundary rather than trusting a cast — a malformed
 * row degrades to an empty list instead of crashing the homepage.
 */
export function parsePatientJourney(value: unknown): PatientJourneyStep[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (step): step is PatientJourneyStep =>
      typeof step === "object" &&
      step !== null &&
      typeof (step as Record<string, unknown>).title === "string" &&
      typeof (step as Record<string, unknown>).text === "string"
  );
}
