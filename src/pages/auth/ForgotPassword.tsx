import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { AuthPageShell } from "@/pages/auth/AuthPageShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!email) {
      setFormError("Enter your email address.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setSubmitting(false);

    // Show the same success state whether or not the email is registered —
    // don't let this form be used to confirm which emails have accounts.
    if (error) {
      setFormError("Something went wrong. Please try again.");
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <AuthPageShell title="Check your email">
        <p className="text-sm text-muted">
          If an account exists for <span className="font-medium text-ink">{email}</span>,
          a password reset link is on its way.
        </p>
        <Link to="/admin/login" className="mt-6 inline-block text-sm text-teal hover:underline">
          Back to sign in
        </Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {formError && (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>

        <p className="text-center text-sm text-muted">
          <Link to="/admin/login" className="text-teal hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
