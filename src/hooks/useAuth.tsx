import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const ADMIN_USERNAME = "Admin_NbM_1";
export const ADMIN_EMAIL = "admin_nbm_1@nailbymuskii.app";

type AuthValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

async function markPresence(userId: string, signedIn: boolean) {
  await supabase
    .from("profiles")
    .update({ signed_in: signedIn, last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  // Role + ban check, and live presence heartbeat.
  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [{ data: banned }, { data: roles }] = await Promise.all([
        supabase.rpc("is_banned", { _user_id: userId }),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (cancelled) return;
      if (banned) {
        await supabase.auth.signOut();
        return;
      }
      setIsAdmin(Boolean(roles?.some((r) => r.role === "admin")));
      void markPresence(userId, true);
    })();
    const timer = window.setInterval(() => void markPresence(userId, true), 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    if (userId) await markPresence(userId, false);
    await supabase.auth.signOut();
  }, [userId]);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isLoggedIn: Boolean(session),
      isAdmin,
      signOut,
    }),
    [session, loading, isAdmin, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
