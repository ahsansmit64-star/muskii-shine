import { createFileRoute } from "@tanstack/react-router";
import { SignIn, useClerk } from "@clerk/react";
import { useEffect, useState } from "react";
import { formatLockout } from "@/lib/admin-identity";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in — Nail by Muskii" },
    { name: "description", content: "Securely sign in to your Nail by Muskii account." },
    { property: "og:title", content: "Sign in — Nail by Muskii" },
    { property: "og:description", content: "Access your nail orders and vouchers." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const clerk = useClerk();
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    // Clerk enforces the actual account lockout. Reflect its retry-after value,
    // never intercept passwords or count DOM error messages as security checks.
    const remove = clerk.addListener((resources) => {
      const signIn = resources.client?.signIn;
      const raw = signIn as unknown as { lockoutExpiresInSeconds?: number } | undefined;
      if (raw?.lockoutExpiresInSeconds) setUntil(Date.now() + raw.lockoutExpiresInSeconds * 1000);
    });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    setNow(Date.now());
    return () => { remove(); window.clearInterval(timer); };
  }, [clerk]);
  const remaining = Math.max(0, Math.ceil((until - now) / 1000));
  return <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-12">
    {remaining > 0 ? <p role="alert" className="text-sm text-destructive">Too many failed login attempts. Please try again in {formatLockout(remaining)}.</p> : null}
    <SignIn routing="hash" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
  </main>;
}