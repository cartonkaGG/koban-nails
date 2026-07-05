import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { applyAuthCookieDefaults } from "@/lib/supabase/cookies";
import { getSupabaseEnv } from "@/lib/supabase/config";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, applyAuthCookieDefaults(options)),
          );
        } catch {
          // Server Component — ignore
        }
      },
    },
  });
}
