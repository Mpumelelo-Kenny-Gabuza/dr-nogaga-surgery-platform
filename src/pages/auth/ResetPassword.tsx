import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/useAuth";
import { AuthPageShell } from "@/pages/auth/AuthPageShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const MIN_PASSWORD_LENGTH = 8;

export function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Clicking the reset email link redirects here with a token in the URL;
  // Supabase's client picks it up automatically and establishes a session.
  // No session at all (after loading settles) means the link was invalid
  // or has already expired.
  if (!loading && !session) {
    return (
      <AuthPageShell title="Link expired">
        <p className="text-sm text-muted">
          This password reset link is invalid or has expired.
        </p>
        <Link
          to="/admin/forgot-password"
          className="mt-6 inline-block text-sm text-teal hover:underline"
        >
          Request a new link
        </Link>
      </AuthPageShell>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    navigate("/admin", { replace: true });
  }

  return (
    <AuthPageShell title="Set a new password">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {formError && (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
