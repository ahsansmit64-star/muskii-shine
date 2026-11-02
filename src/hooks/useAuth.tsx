import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { connectClerkAccount } from "@/lib/clerk.functions";
import { isPrimaryAdmin } from "@/lib/admin-identity";
export { ADMIN_EMAIL, ADMIN_USERNAME } from "@/lib/admin-identity";

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
  const { isLoaded, isSignedIn, userId: clerkId, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();
  const connect = useServerFn(connectClerkAccount);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "TOKEN_REFRESHED") setSession(next);
      if (event === "SIGNED_OUT") {
        setSession(null);
        setIsAdmin(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    setLoading(true);
    setSession(null);
    setIsAdmin(false);
    void (async () => {
      try {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut({ scope: "local" });
        if (!isSignedIn || !clerkId) return;
        const token = await getToken();
        if (!token) throw new Error("Sign in again to continue.");
        const linked = await connect({ data: { token } });
        if (cancelled) return;
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: linked.tokenHash, type: "magiclink" });
        if (error || !data.session || data.session.user.id !== linked.userId) throw new Error("Could not finish signing in.");
        const { data: validated, error: validationError } = await supabase.auth.getUser();
        if (validationError || !validated.user) throw new Error("Sign in again to continue.");
        if (!cancelled) setSession(data.session);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Could not sign in.");
          await supabase.auth.signOut({ scope: "local" });
          await clerk.signOut();
        }
      } finally {
        if (!cancelled) { setLoading(false); void router.invalidate(); }
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, clerkId, getToken, connect, queryClient, clerk, router]);

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
      const primary = clerkUser?.primaryEmailAddress;
      setIsAdmin(isPrimaryAdmin(primary?.emailAddress, primary?.verification?.status === "verified") && Boolean(roles?.some((r) => r.role === "admin")));
      void markPresence(userId, true);
    })();
    const timer = window.setInterval(() => void markPresence(userId, true), 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [userId, clerkUser]);

  const signOut = useCallback(async () => {
    if (userId) await markPresence(userId, false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await clerk.signOut();
    await navigate({ to: "/auth", replace: true });
  }, [userId, queryClient, clerk, navigate]);

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
