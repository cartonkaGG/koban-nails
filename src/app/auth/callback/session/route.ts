import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyAuthCookieDefaults } from "@/lib/supabase/cookies";
import { getSafeRedirectPath } from "@/lib/security/redirect";
import {
  getSupabaseEnv,
  isAdminEmail,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

/** Completes a session started from hash tokens in /auth/callback. */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    next?: string;
  } | null;

  const accessToken = body?.access_token?.trim();
  const refreshToken = body?.refresh_token?.trim();
  const safeNext = getSafeRedirectPath(body?.next);

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, redirectTo: safeNext });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, applyAuthCookieDefaults(options));
        });
      },
    },
  });

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data.user) {
    console.error("[auth/callback/session] setSession failed:", error?.message);
    return NextResponse.json({ error: "Session failed" }, { status: 400 });
  }

  if (data.user.email && isSupabaseAdminConfigured()) {
    const adminSupabase = await createAdminClient();
    const email = data.user.email.toLowerCase();
    await adminSupabase.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name:
        (data.user.user_metadata?.full_name as string | undefined) ?? email.split("@")[0],
      role: isAdminEmail(email) ? "admin" : "student",
    });
  }

  response.cookies.delete("koban_demo_user");
  return response;
}
