export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  return { url, key };
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
