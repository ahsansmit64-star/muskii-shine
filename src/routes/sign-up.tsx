import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@clerk/react";

export const Route = createFileRoute("/sign-up")({
  head: () => ({ meta: [
    { title: "Create account — Nail by Muskii" },
    { name: "description", content: "Create your secure Nail by Muskii account." },
    { property: "og:title", content: "Create account — Nail by Muskii" },
    { property: "og:description", content: "Register to order handmade nails and save vouchers." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <main className="mx-auto flex max-w-lg justify-center px-4 py-12"><SignUp routing="hash" signInUrl="/auth" fallbackRedirectUrl="/" /></main>,
});