import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createUserClient } from "@/lib/supabase/server";
import {
  getSupabaseEnv,
  getSupabaseServiceRoleKey,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/config";

export async function createAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    console.error(
      "createAdminClient: SUPABASE_SERVICE_ROLE_KEY missing or too short — guest support will not work",
    );
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
