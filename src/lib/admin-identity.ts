export const ADMIN_USERNAME = "Admin_NbM_1";
export const ADMIN_EMAIL = "naildairiesbymuskiii@gmail.com";

export function isPrimaryAdmin(email: string | null | undefined, verified: boolean) {
  return verified && email?.trim().toLowerCase() === ADMIN_EMAIL;
}

export function isReservedUsername(username: string | null | undefined) {
  return username?.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase();
}

export function formatLockout(seconds: number) {
  const remaining = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
}