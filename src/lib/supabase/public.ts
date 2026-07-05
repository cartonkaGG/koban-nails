import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";

/** Anonymous client for public reads — safe inside unstable_cache (no cookies). */
export function createPublicClient() {
  const { url, key } = getSupabaseEnv();
  return createSupabaseClient(url, key);
}
