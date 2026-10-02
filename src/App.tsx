import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Placeholder } from "@/pages/Placeholder";
import { NotFound } from "@/pages/NotFound";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { Login } from "@/pages/auth/Login";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { ResetPassword } from "@/pages/auth/ResetPassword";

export default function App() {
  return (
    <Routes>
      {/* Public site — §4/§5 (Phase 4) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Placeholder title="Home" phase="Phase 4 — Public Website" />} />
        <Route path="/about" element={<Placeholder title="About Dr Nogaga" phase="Phase 4" />} />
        <Route path="/procedures" element={<Placeholder title="Procedures" phase="Phase 4" />} />
        <Route path="/procedures/:slug" element={<Placeholder title="Procedure detail" phase="Phase 4" />} />
        <Route path="/reconstructive-surgery" element={<Placeholder title="Reconstructive Surgery" phase="Phase 4" />} />
        <Route path="/resources" element={<Placeholder title="Patient Resources / Blog" phase="Phase 4 + 7 — blog engagement" />} />
        <Route path="/resources/:slug" element={<Placeholder title="Article" phase="Phase 4 + 7 — likes, comments, sharing" />} />
        <Route path="/gallery" element={<Placeholder title="Gallery" phase="Phase 4" />} />
        <Route path="/testimonials" element={<Placeholder title="Testimonials" phase="Phase 4" />} />
        <Route path="/faq" element={<Placeholder title="Frequently Asked Questions" phase="Phase 4" />} />
        <Route path="/contact" element={<Placeholder title="Contact" phase="Phase 4" />} />
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
