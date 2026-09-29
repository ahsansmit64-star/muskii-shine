/**
 * Static presentation build: no backend auth.
 * Every visitor is treated as a signed-in demo customer so all features are visible.
 * The admin flag is a local demo toggle (localStorage) so the client can review
 * the admin portal; in the production build this comes from a server-side role.
 */
import { isAdmin } from "@/lib/mock-store";

export type MockUser = { id: string; email: string; name: string };

export const MOCK_USER: MockUser = {
  id: "demo-user",
  email: "demo@nailbymuskii.pk",
  name: "Demo Customer",
};

export function useAuth() {
  return {
    user: MOCK_USER,
    session: null,
    loading: false,
    isLoggedIn: true,
    isAdmin: isAdmin(),
  } as const;
}
