import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createUserClient } from "@/lib/supabase/server";
import {
  getSupabaseEnv,
  getSupabaseServiceRoleKey,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/config";

export async function createAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    return createUserClient();
  }

  const { url } = getSupabaseEnv();
  return createSupabaseClient(url, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
