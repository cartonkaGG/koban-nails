export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  return { url, key };
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

/** True only when Supabase is fully configured (not empty placeholders). */
export function isSupabaseConfigured() {
  const { url, key } = getSupabaseEnv();
  return (
    url.length > 0 &&
    key.length > 20 &&
    url.startsWith("https://") &&
    url.includes("supabase.co")
  );
}

export function isSupabaseAdminConfigured() {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  return isSupabaseConfigured() && serviceRoleKey.length > 40;
}
