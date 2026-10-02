import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { AuthPageShell } from "@/pages/auth/AuthPageShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function Login() {
  const { session, profile, loading, signIn } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Already signed in with a valid staff session — don't show the login
  // form again, just continue to wherever they were headed.
  if (!loading && session && profile) {
    const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/admin";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    // Supabase's own message here is already patient-safe (doesn't reveal
    // whether the email exists), so it's shown as-is rather than rewritten.
    if (error) setFormError(error);
  }

  return (
    <AuthPageShell title="Practice Admin" subtitle="Sign in to manage the website.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {formError && (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center text-sm text-muted">
          <Link to="/admin/forgot-password" className="text-teal hover:underline">
            Forgot your password?
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
