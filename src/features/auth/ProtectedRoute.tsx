import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";

/**
 * Wraps every /admin route. Client-side redirect is a UX convenience only —
 * the real boundary is RLS (spec §22: "Never rely solely on frontend route
 * protection"). Every query an unauthenticated or deactivated user could
 * still somehow trigger returns nothing, because Postgres enforces it.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, session, profile, signOut } = useAuth();
  const location = useLocation();

  const hasValidStaffSession = Boolean(session && profile);

  // A session can exist with no matching active profile — e.g. a
  // deactivated staff account whose profiles row is now invisible to its
  // own RLS policy (migration 20260930090100). Clear the stale session
  // rather than leaving the person stuck in a half-authenticated state.
  useEffect(() => {
    if (!loading && session && !profile) {
      signOut();
    }
  }, [loading, session, profile, signOut]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-sm text-muted">
        Checking your session&hellip;
      </div>
    );
  }

  if (!hasValidStaffSession) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
