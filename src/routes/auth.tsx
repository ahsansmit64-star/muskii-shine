import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { cleanText } from "@/lib/sanitize";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Nail by Muskii" },
      {
        name: "description",
        content: "Sign in or create an account to order press-on nail sets from Nail by Muskii.",
      },
      { property: "og:title", content: "Sign in — Nail by Muskii" },
      { property: "og:description", content: "Create an account to order and use your lucky spin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user) void navigate({ to: "/" });
  }, [user, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: cleanText(email, 255),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: cleanText(fullName, 100) },
        },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        setNotice("Check your email and confirm your address to finish signing up.");
        return;
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanText(email, 255),
      password,
    });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try again.");
      return;
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create an account"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You need an account to place an order and to use your one lucky spin.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        {mode === "signup" ? (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Full name
            </span>
            <Input
              className="min-h-12"
              value={fullName}
              maxLength={100}
              autoComplete="name"
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email
          </span>
          <Input
            className="min-h-12"
            type="email"
            value={email}
            maxLength={255}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Password
          </span>
          <Input
            className="min-h-12"
            type="password"
            value={password}
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {notice ? (
          <p className="rounded-md border border-gold bg-secondary p-3 text-sm">{notice}</p>
        ) : null}

        <Button size="touch" type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <Button size="touch" variant="outline" className="mt-3 w-full" onClick={() => void google()}>
        Continue with Google
      </Button>

      <button
        type="button"
        className="mt-5 min-h-12 text-sm font-semibold text-gold-deep underline"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setNotice(null);
        }}
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}