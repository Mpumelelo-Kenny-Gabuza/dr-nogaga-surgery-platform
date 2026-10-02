import { createContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AuthContextValue = {
  /** True until the initial session check has resolved. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  /** The matching public.profiles row — null while loading, or if deactivated. */
  profile: Profile | null;
  isAdmin: boolean;
  isEditor: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  // A deactivated staff member (is_active = false) is invisible to their own
  // SELECT policy query too — see migration 20260930090100 — so this also
  // naturally covers "deactivated user tries to use an old session".
  if (error) return null;
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      setSession(currentSession);
      if (currentSession) {
        const p = await fetchProfile(currentSession.user.id);
        if (!cancelled) setProfile(p);
      }
      if (!cancelled) setLoading(false);
    }

    init();

    // Keeps state in sync across sign-in, sign-out, token refresh, and
    // another tab signing out — this is the "secure session persistence"
    // requirement from spec §22, handled by Supabase's own session storage.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        const p = await fetchProfile(newSession.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value: AuthContextValue = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: profile?.role === "ADMIN",
    isEditor: profile?.role === "EDITOR",
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
