import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { PlanType } from "@/lib/plans";

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  plan_type: PlanType;
}

interface CreditsRow {
  credits_remaining: number;
  monthly_credit_limit: number;
  credits_used_this_month: number;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  credits: CreditsRow | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [credits, setCredits] = useState<CreditsRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, plan_type").eq("id", uid).maybeSingle(),
      supabase
        .from("user_credits")
        .select("credits_remaining, monthly_credit_limit, credits_used_this_month")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);
    setProfile((p as ProfileRow) ?? null);
    setCredits((c as CreditsRow) ?? null);
  };

  useEffect(() => {
    // CRITICAL: subscribe BEFORE getSession
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer to avoid deadlock
        setTimeout(() => loadProfile(sess.user.id), 0);
      } else {
        setProfile(null);
        setCredits(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadProfile(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (user) await loadProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCredits(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, credits, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
