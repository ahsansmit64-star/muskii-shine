import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Nail by Muskii" },
      { name: "description", content: "Sign in or create a Nail by Muskii account to order and spin the wheel." },
      { property: "og:title", content: "Sign in — Nail by Muskii" },
      { property: "og:description", content: "Sign in or create an account to order press-on nails." },
    ],
  }),
  component: AuthPage,
});

const USERNAME_RE = /^[A-Za-z0-9_]{3,24}$/;

/** Usernames map to a private sign-in address; real emails are used as-is. */
function toEmail(login: string) {
  const v = login.trim();
  return v.includes("@") ? v.toLowerCase() : `${v.toLowerCase()}@nailbymuskii.app`;
}

function AuthPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [login, setLogin] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isLoggedIn) void navigate({ to: "/" });
  }, [isLoggedIn, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (mode === "up") {
      if (!USERNAME_RE.test(login.trim())) {
        toast.error("Username: 3–24 letters, numbers or underscores.");
        return;
      }
      if (login.trim().toLowerCase() === "admin_nbm_1") {
        toast.error("This username is reserved.");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }
    }
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email: toEmail(login), password })
        : await supabase.auth.signUp({
            email: toEmail(login),
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: { username: login.trim(), full_name: fullName.trim().slice(0, 100) },
            },
          });
    setBusy(false);
    if (error) {
      toast.error(
        mode === "in"
          ? "Wrong username or password."
          : /registered|exists/i.test(error.message)
            ? "This username is already taken."
            : "Could not create your account.",
      );
      return;
    }
    toast.success(mode === "in" ? "Signed in." : "Account created.");
  };

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "up" ? (
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="login">Username</Label>
          <Input id="login" required autoComplete="username" value={login} maxLength={80} onChange={(e) => setLogin(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="touch" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <button
        type="button"
        className="mt-4 min-h-12 w-full text-sm font-medium text-gold-deep"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
      >
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
