import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Placeholder } from "@/pages/Placeholder";
import { NotFound } from "@/pages/NotFound";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { Login } from "@/pages/auth/Login";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { ResetPassword } from "@/pages/auth/ResetPassword";
import { Home } from "@/pages/public/Home";
import { About } from "@/pages/public/About";
import { Procedures } from "@/pages/public/Procedures";
import { ProcedureDetail } from "@/pages/public/ProcedureDetail";
import { ReconstructiveSurgery } from "@/pages/public/ReconstructiveSurgery";
import { Resources } from "@/pages/public/Resources";
import { ArticleDetail } from "@/pages/public/ArticleDetail";
import { Gallery } from "@/pages/public/Gallery";
import { Testimonials } from "@/pages/public/Testimonials";
import { Faq } from "@/pages/public/Faq";
import { Contact } from "@/pages/public/Contact";
import { Consultation } from "@/pages/public/Consultation";

// Admin — Phase 5 (CMS). The admin "About" page is aliased on import since
// its export name collides with the public About page above; both are
// genuinely named `About` in their own files because each is the obvious
// name for what it is.
import { Dashboard } from "@/pages/admin/Dashboard";
import { WebsiteContent } from "@/pages/admin/WebsiteContent";
import { About as AdminAbout } from "@/pages/admin/About";
import { ProceduresList } from "@/pages/admin/procedures/ProceduresList";
import { ProcedureForm } from "@/pages/admin/procedures/ProcedureForm";
import { ResourcesList } from "@/pages/admin/resources/ResourcesList";
import { PostForm } from "@/pages/admin/resources/PostForm";
import { GalleryList } from "@/pages/admin/GalleryList";
import { GalleryForm } from "@/pages/admin/GalleryForm";
import { TestimonialsList } from "@/pages/admin/TestimonialsList";
import { TestimonialForm } from "@/pages/admin/TestimonialForm";
import { FaqsList } from "@/pages/admin/FaqsList";
import { FaqForm } from "@/pages/admin/FaqForm";
import { Settings } from "@/pages/admin/Settings";
import { EnquiriesList } from "@/pages/admin/enquiries/EnquiriesList";
import { EnquiryDetail } from "@/pages/admin/enquiries/EnquiryDetail";
import { CommentsList } from "@/pages/admin/comments/CommentsList";

export default function App() {
  return (
    <Routes>
      {/* Public site — §4/§5 (Phase 4) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/procedures" element={<Procedures />} />
        <Route path="/procedures/:slug" element={<ProcedureDetail />} />
        <Route path="/reconstructive-surgery" element={<ReconstructiveSurgery />} />
        {/* Engagement (likes, comments, sharing — Phase 7) lives on
            ArticleDetail itself; see its own imports. */}
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:slug" element={<ArticleDetail />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/consultation" element={<Consultation />} />
        <Route path="/privacy" element={<Placeholder title="Privacy Policy" phase="Phase 9" />} />
        <Route path="/terms" element={<Placeholder title="Terms" phase="Phase 9" />} />
        <Route path="/disclaimer" element={<Placeholder title="Medical Disclaimer" phase="Phase 9" />} />
      </Route>

      {/* Admin — §19 (Phase 5 content), gated behind real auth (Phase 3) */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/content" element={<WebsiteContent />} />
        <Route path="/admin/about" element={<AdminAbout />} />

        <Route path="/admin/procedures" element={<ProceduresList />} />
        <Route path="/admin/procedures/new" element={<ProcedureForm />} />
        <Route path="/admin/procedures/:id" element={<ProcedureForm />} />

        <Route path="/admin/resources" element={<ResourcesList />} />
        <Route path="/admin/resources/new" element={<PostForm />} />
        <Route path="/admin/resources/:id" element={<PostForm />} />

        <Route path="/admin/comments" element={<CommentsList />} />

        <Route path="/admin/gallery" element={<GalleryList />} />
        <Route path="/admin/gallery/new" element={<GalleryForm />} />
        <Route path="/admin/gallery/:id" element={<GalleryForm />} />

        <Route path="/admin/testimonials" element={<TestimonialsList />} />
        <Route path="/admin/testimonials/new" element={<TestimonialForm />} />
        <Route path="/admin/testimonials/:id" element={<TestimonialForm />} />

        <Route path="/admin/faqs" element={<FaqsList />} />
        <Route path="/admin/faqs/new" element={<FaqForm />} />
        <Route path="/admin/faqs/:id" element={<FaqForm />} />

        <Route path="/admin/enquiries" element={<EnquiriesList />} />
        <Route path="/admin/enquiries/:id" element={<EnquiryDetail />} />

        {/* No route-level ADMIN-only gate here beyond the sidebar hiding it —
            RLS is the real boundary (spec §22: never rely on frontend-only
            protection). An EDITOR who browses here directly can still edit
            site_settings/practice_locations (RLS grants those to any staff
            member), but the role/active controls on existing profiles are
            genuinely ADMIN-only at the database level regardless of this
            route being reachable. */}
        <Route path="/admin/settings" element={<Settings />} />
      </Route>

      {/* Auth — §22/23. Deliberately outside ProtectedRoute: you're not
          signed in yet when you need these. */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/reset-password" element={<ResetPassword />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
