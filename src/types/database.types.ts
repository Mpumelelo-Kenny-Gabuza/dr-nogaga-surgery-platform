export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      about_affiliations: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          kind: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          kind?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          kind?: string;
          name?: string;
        };
        Relationships: [];
      };
      about_content: {
        Row: {
          approach_to_patient_care: string | null;
          biography: string | null;
          full_name: string | null;
          id: boolean;
          professional_title: string | null;
          profile_image_url: string | null;
          updated_at: string;
        };
        Insert: {
          approach_to_patient_care?: string | null;
          biography?: string | null;
          full_name?: string | null;
          id?: boolean;
          professional_title?: string | null;
          profile_image_url?: string | null;
          updated_at?: string;
        };
        Update: {
          approach_to_patient_care?: string | null;
          biography?: string | null;
          full_name?: string | null;
          id?: boolean;
          professional_title?: string | null;
          profile_image_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      about_qualifications: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          institution: string | null;
          title: string;
          year_obtained: number | null;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          institution?: string | null;
          title: string;
          year_obtained?: number | null;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          institution?: string | null;
          title?: string;
          year_obtained?: number | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          content: string;
          created_at: string;
          email: string | null;
          id: string;
          is_practice_reply: boolean;
          name: string;
          parent_comment_id: string | null;
          post_id: string;
          status: Database["public"]["Enums"]["comment_status"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_practice_reply?: boolean;
          name: string;
          parent_comment_id?: string | null;
          post_id: string;
          status?: Database["public"]["Enums"]["comment_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_practice_reply?: boolean;
          name?: string;
          parent_comment_id?: string | null;
          post_id?: string;
          status?: Database["public"]["Enums"]["comment_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      enquiries: {
        Row: {
          area_of_enquiry: string | null;
          consent: boolean;
          created_at: string;
          email: string | null;
          first_name: string;
          id: string;
          message: string | null;
          phone: string;
          preferred_contact_method: Database["public"]["Enums"]["preferred_contact_method"];
          preferred_date: string | null;
          reference: string;
          status: Database["public"]["Enums"]["enquiry_status"];
          surname: string;
          updated_at: string;
        };
        Insert: {
          area_of_enquiry?: string | null;
          consent?: boolean;
          created_at?: string;
          email?: string | null;
          first_name: string;
          id?: string;
          message?: string | null;
          phone: string;
          preferred_contact_method?: Database["public"]["Enums"]["preferred_contact_method"];
          preferred_date?: string | null;
          reference: string;
          status?: Database["public"]["Enums"]["enquiry_status"];
          surname: string;
          updated_at?: string;
        };
        Update: {
          area_of_enquiry?: string | null;
          consent?: boolean;
          created_at?: string;
          email?: string | null;
          first_name?: string;
          id?: string;
          message?: string | null;
          phone?: string;
          preferred_contact_method?: Database["public"]["Enums"]["preferred_contact_method"];
          preferred_date?: string | null;
          reference?: string;
          status?: Database["public"]["Enums"]["enquiry_status"];
          surname?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      enquiry_notes: {
        Row: {
          author_id: string | null;
          created_at: string;
          enquiry_id: string;
          id: string;
          note: string;
        };
        Insert: {
          author_id?: string | null;
          created_at?: string;
          enquiry_id: string;
          id?: string;
          note: string;
        };
        Update: {
          author_id?: string | null;
          created_at?: string;
          enquiry_id?: string;
          id?: string;
          note?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enquiry_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiry_notes_enquiry_id_fkey";
            columns: ["enquiry_id"];
            isOneToOne: false;
            referencedRelation: "enquiries";
            referencedColumns: ["id"];
          },
        ];
      };
      faqs: {
        Row: {
          answer: string;
          category: string | null;
          created_at: string;
          display_order: number;
          id: string;
          published: boolean;
          question: string;
          updated_at: string;
        };
        Insert: {
          answer: string;
          category?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          published?: boolean;
          question: string;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          category?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          published?: boolean;
          question?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gallery_items: {
        Row: {
          alt_text: string | null;
          caption: string | null;
          category: string | null;
          created_at: string;
          display_order: number;
          id: string;
          image_url: string;
          published: boolean;
          updated_at: string;
        };
        Insert: {
          alt_text?: string | null;
          caption?: string | null;
          category?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url: string;
          published?: boolean;
          updated_at?: string;
        };
        Update: {
          alt_text?: string | null;
          caption?: string | null;
          category?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url?: string;
          published?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      homepage_content: {
        Row: {
          consultation_cta_heading: string | null;
          consultation_cta_text: string | null;
          hero_cta_primary_label: string | null;
          hero_cta_primary_url: string | null;
          hero_cta_secondary_label: string | null;
          hero_cta_secondary_url: string | null;
          hero_image_url: string | null;
          hero_text: string | null;
          hero_title: string | null;
          id: boolean;
          intro_heading: string | null;
          intro_text: string | null;
          patient_journey: NonNullable<Json>;
          reconstructive_heading: string | null;
          reconstructive_text: string | null;
          updated_at: string;
        };
        Insert: {
          consultation_cta_heading?: string | null;
          consultation_cta_text?: string | null;
          hero_cta_primary_label?: string | null;
          hero_cta_primary_url?: string | null;
          hero_cta_secondary_label?: string | null;
          hero_cta_secondary_url?: string | null;
          hero_image_url?: string | null;
          hero_text?: string | null;
          hero_title?: string | null;
          id?: boolean;
          intro_heading?: string | null;
          intro_text?: string | null;
          patient_journey?: NonNullable<Json>;
          reconstructive_heading?: string | null;
          reconstructive_text?: string | null;
          updated_at?: string;
        };
        Update: {
          consultation_cta_heading?: string | null;
          consultation_cta_text?: string | null;
          hero_cta_primary_label?: string | null;
          hero_cta_primary_url?: string | null;
          hero_cta_secondary_label?: string | null;
          hero_cta_secondary_url?: string | null;
          hero_image_url?: string | null;
          hero_text?: string | null;
          hero_title?: string | null;
          id?: boolean;
          intro_heading?: string | null;
          intro_text?: string | null;
          patient_journey?: NonNullable<Json>;
          reconstructive_heading?: string | null;
          reconstructive_text?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          alt_text: string | null;
          bucket: string;
          created_at: string;
          file_name: string;
          id: string;
          mime_type: string | null;
          path: string;
          size_bytes: number | null;
          uploaded_by: string | null;
          url: string;
        };
        Insert: {
          alt_text?: string | null;
          bucket: string;
          created_at?: string;
          file_name: string;
          id?: string;
          mime_type?: string | null;
          path: string;
          size_bytes?: number | null;
          uploaded_by?: string | null;
          url: string;
        };
        Update: {
          alt_text?: string | null;
          bucket?: string;
          created_at?: string;
          file_name?: string;
          id?: string;
          mime_type?: string | null;
          path?: string;
          size_bytes?: number | null;
          uploaded_by?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_assets_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      post_categories: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      post_likes: {
        Row: {
          anon_key: string | null;
          created_at: string;
          id: string;
          post_id: string;
          user_id: string | null;
        };
        Insert: {
          anon_key?: string | null;
          created_at?: string;
          id?: string;
          post_id: string;
          user_id?: string | null;
        };
        Update: {
          anon_key?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      post_tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      post_tags_map: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_tags_map_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_tags_map_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "post_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string | null;
          canonical_url: string | null;
          category_id: string | null;
          content_html: string | null;
          created_at: string;
          excerpt: string | null;
          featured_image_url: string | null;
          id: string;
          is_featured: boolean;
          published_at: string | null;
          reading_time_minutes: number | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          canonical_url?: string | null;
          category_id?: string | null;
          content_html?: string | null;
          created_at?: string;
          excerpt?: string | null;
          featured_image_url?: string | null;
          id?: string;
          is_featured?: boolean;
          published_at?: string | null;
          reading_time_minutes?: number | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          canonical_url?: string | null;
          category_id?: string | null;
          content_html?: string | null;
          created_at?: string;
          excerpt?: string | null;
          featured_image_url?: string | null;
          id?: string;
          is_featured?: boolean;
          published_at?: string | null;
          reading_time_minutes?: number | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "post_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      procedure_categories: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      procedure_faqs: {
        Row: {
          display_order: number;
          faq_id: string;
          procedure_id: string;
        };
        Insert: {
          display_order?: number;
          faq_id: string;
          procedure_id: string;
        };
        Update: {
          display_order?: number;
          faq_id?: string;
          procedure_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "procedure_faqs_faq_id_fkey";
            columns: ["faq_id"];
            isOneToOne: false;
            referencedRelation: "faqs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procedure_faqs_procedure_id_fkey";
            columns: ["procedure_id"];
            isOneToOne: false;
            referencedRelation: "procedures";
            referencedColumns: ["id"];
          },
        ];
      };
      procedure_images: {
        Row: {
          alt_text: string | null;
          caption: string | null;
          created_at: string;
          display_order: number;
          id: string;
          image_url: string;
          procedure_id: string;
        };
        Insert: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url: string;
          procedure_id: string;
        };
        Update: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url?: string;
          procedure_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "procedure_images_procedure_id_fkey";
            columns: ["procedure_id"];
            isOneToOne: false;
            referencedRelation: "procedures";
            referencedColumns: ["id"];
          },
        ];
      };
      procedures: {
        Row: {
          category_id: string | null;
          created_at: string;
          display_order: number;
          featured_image_url: string | null;
          full_description: string | null;
          id: string;
          is_featured: boolean;
          patient_information: string | null;
          preparation_information: string | null;
          recovery_information: string | null;
          risks_disclaimer: string | null;
          seo_description: string | null;
          seo_title: string | null;
          short_description: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          display_order?: number;
          featured_image_url?: string | null;
          full_description?: string | null;
          id?: string;
          is_featured?: boolean;
          patient_information?: string | null;
          preparation_information?: string | null;
          recovery_information?: string | null;
          risks_disclaimer?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          display_order?: number;
          featured_image_url?: string | null;
          full_description?: string | null;
          id?: string;
          is_featured?: boolean;
          patient_information?: string | null;
          preparation_information?: string | null;
          recovery_information?: string | null;
          risks_disclaimer?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "procedures_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "procedure_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          contact_whatsapp: string | null;
          footer_copyright_text: string | null;
          footer_disclaimer_text: string | null;
          id: boolean;
          map_embed_url: string | null;
          operating_hours: string | null;
          seo_default_description: string | null;
          seo_default_title: string | null;
          seo_og_image_url: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          contact_whatsapp?: string | null;
          footer_copyright_text?: string | null;
          footer_disclaimer_text?: string | null;
          id?: boolean;
          map_embed_url?: string | null;
          operating_hours?: string | null;
          seo_default_description?: string | null;
          seo_default_title?: string | null;
          seo_og_image_url?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          contact_whatsapp?: string | null;
          footer_copyright_text?: string | null;
          footer_disclaimer_text?: string | null;
          id?: boolean;
          map_embed_url?: string | null;
          operating_hours?: string | null;
          seo_default_description?: string | null;
          seo_default_title?: string | null;
          seo_og_image_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_links: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          platform: string;
          published: boolean;
          url: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          platform: string;
          published?: boolean;
          url: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          platform?: string;
          published?: boolean;
          url?: string;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          created_at: string;
          display_name: string;
          display_order: number;
          id: string;
          image_url: string | null;
          is_featured: boolean;
          procedure_id: string | null;
          status: Database["public"]["Enums"]["content_status"];
          testimonial_text: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          procedure_id?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          testimonial_text: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          procedure_id?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          testimonial_text?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "testimonials_procedure_id_fkey";
            columns: ["procedure_id"];
            isOneToOne: false;
            referencedRelation: "procedures";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      dearmor: { Args: { "": string }; Returns: string };
      gen_random_uuid: { Args: Record<PropertyKey, never>; Returns: string };
      gen_salt: { Args: { "": string }; Returns: string };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      pgp_armor_headers: {
        Args: { "": string };
        Returns: Record<string, unknown>[];
      };
    };
    Enums: {
      comment_status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
      content_status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      enquiry_status: "NEW" | "CONTACTED" | "CONSULTATION_BOOKED" | "CLOSED";
      preferred_contact_method: "WHATSAPP" | "PHONE" | "EMAIL";
      user_role: "ADMIN" | "EDITOR";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      comment_status: ["PENDING", "APPROVED", "REJECTED", "HIDDEN"],
      content_status: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      enquiry_status: ["NEW", "CONTACTED", "CONSULTATION_BOOKED", "CLOSED"],
      preferred_contact_method: ["WHATSAPP", "PHONE", "EMAIL"],
      user_role: ["ADMIN", "EDITOR"],
    },
  },
} as const;
