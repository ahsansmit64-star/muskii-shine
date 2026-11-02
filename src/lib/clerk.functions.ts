import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { ADMIN_EMAIL, ADMIN_USERNAME, isPrimaryAdmin, isReservedUsername } from "@/lib/admin-identity";

export const clerkConfiguration = createServerFn({ method: "GET" }).handler(() => {
  const publishableKey = process.env["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"];
  if (!publishableKey) throw new Error("Clerk sign-in is not configured.");
  return { publishableKey };
});

// A verified Clerk session is exchanged for a one-use Cloud session, preserving
// existing UUID ownership and RLS instead of replacing database authorization.
export const connectClerkAccount = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ token: z.string().min(1).max(12000) }).parse(input))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const secretKey = process.env["CLERK_SECRET_KEY"];
    if (!secretKey) throw new Error("Clerk sign-in is not configured.");
    const { verifyToken, createClerkClient } = await import("@clerk/backend");
    const claims = await verifyToken(data.token, {
      secretKey,
      authorizedParties: [
        "http://localhost:8080",
        "https://muskii-shine.lovable.app",
        "https://id-preview--5d5ff795-0a85-4fbd-a04d-7df564bd630d.lovable.app",
      ],
    });
    if (!claims.sub || typeof claims.sid !== "string") throw new Error("Sign in again to continue.");
    const clerk = createClerkClient({ secretKey });
    const [account, session] = await Promise.all([
      clerk.users.getUser(claims.sub),
      clerk.sessions.getSession(claims.sid),
    ]);
    if (session.status !== "active" || session.userId !== account.id || account.banned || account.locked) {
      throw new Error("This account cannot sign in right now.");
    }
    const primary = account.emailAddresses.find((e) => e.id === account.primaryEmailAddressId);
    const email = primary?.emailAddress.toLowerCase();
    const verified = primary?.verification?.status === "verified";
    if (!email || !verified) throw new Error("Verify your email address in Clerk before continuing.");
    const admin = isPrimaryAdmin(email, verified);
    if (isReservedUsername(account.username) && !admin) throw new Error("This username is reserved for the store administrator.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mapping, error: mappingError } = await supabaseAdmin.from("clerk_accounts" as never)
      .select("user_id").eq("clerk_id", account.id).maybeSingle();
    if (mappingError) throw new Error("Account linking is temporarily unavailable.");
    const existingId = (mapping as { user_id?: string } | null)?.user_id;
    if (existingId) {
      const { data: existing } = await supabaseAdmin.auth.admin.getUserById(existingId);
      if (existing.user?.email?.toLowerCase() !== email) throw new Error("Contact the store before changing your linked email address.");
      const { data: banned, error } = await supabaseAdmin.from("customer_bans").select("user_id").eq("user_id", existingId).maybeSingle();
      if (error || banned) throw new Error("This account cannot place orders or spin.");
    }
    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink", email,
      options: { data: { full_name: [account.firstName, account.lastName].filter(Boolean).join(" ") } },
    });
    if (linkError || !link.user || !link.properties?.hashed_token) throw new Error("Could not connect your account.");
    const userId = link.user.id;
    // Check bans again for existing email accounts that have not yet been linked.
    const { data: banned, error: banError } = await supabaseAdmin.from("customer_bans").select("user_id").eq("user_id", userId).maybeSingle();
    if (banError || banned) throw new Error("This account cannot place orders or spin.");
    if (existingId && existingId !== userId) throw new Error("Account ownership could not be confirmed.");
    const { error: bindError } = await supabaseAdmin.from("clerk_accounts" as never).upsert({
      clerk_id: account.id, user_id: userId, verified_email: email,
    } as never, { onConflict: "clerk_id" });
    if (bindError) throw new Error("Could not link your account safely.");
    if (admin) {
      const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
      if (roleError) throw new Error("Could not confirm administrator access.");
      const { error: releaseError } = await supabaseAdmin.from("profiles").update({ username: null }).ilike("username", ADMIN_USERNAME).neq("id", userId);
      if (releaseError) throw new Error("Could not reserve administrator identity.");
    }
    const { error: profileError } = await supabaseAdmin.from("profiles").update({
      email: admin ? ADMIN_EMAIL : email,
      username: admin ? ADMIN_USERNAME : account.username,
      full_name: [account.firstName, account.lastName].filter(Boolean).join(" ").slice(0, 100),
    }).eq("id", userId);
    if (profileError) throw new Error("Could not save your account profile.");
    return { tokenHash: link.properties.hashed_token, userId };
  });