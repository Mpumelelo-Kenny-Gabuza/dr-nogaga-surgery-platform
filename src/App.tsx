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
        {/* Engagement (likes, comments, sharing) lands in Phase 7 — these
            two render real published content read-only until then. */}
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:slug" element={<ArticleDetail />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/consultation" element={<Placeholder title="Consultation Enquiry" phase="Phase 6 — enquiry workflow" />} />
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
        <Route path="/admin" element={<Placeholder title="Dashboard" phase="Phase 5 — CMS" />} />
        <Route path="/admin/content" element={<Placeholder title="Website Content" phase="Phase 5" />} />
        <Route path="/admin/about" element={<Placeholder title="About" phase="Phase 5" />} />
        <Route path="/admin/procedures" element={<Placeholder title="Procedures" phase="Phase 5" />} />
        <Route path="/admin/resources" element={<Placeholder title="Resources" phase="Phase 5" />} />
        <Route path="/admin/comments" element={<Placeholder title="Comments" phase="Phase 7 — moderation" />} />
        <Route path="/admin/gallery" element={<Placeholder title="Gallery" phase="Phase 5" />} />
        <Route path="/admin/testimonials" element={<Placeholder title="Testimonials" phase="Phase 5" />} />
        <Route path="/admin/faqs" element={<Placeholder title="FAQs" phase="Phase 5" />} />
        <Route path="/admin/enquiries" element={<Placeholder title="Enquiries" phase="Phase 6" />} />
        {/* No route-level ADMIN-only gate here beyond the sidebar hiding it —
            RLS is the real boundary (spec §22: never rely on frontend-only
            protection), so an EDITOR who browses here directly still can't
            read or write anything the Settings page would show. */}
        <Route path="/admin/settings" element={<Placeholder title="Settings" phase="Phase 5" />} />
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
