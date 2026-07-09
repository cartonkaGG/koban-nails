import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyAuthCookieDefaults } from "@/lib/supabase/cookies";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { getSafeRedirectPath } from "@/lib/security/redirect";
import {
  getSupabaseEnv,
  isAdminEmail,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limited = rateLimit({ key: `login:${ip}`, limit: 15, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { email, password, redirectTo } = await request.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPassword = typeof password === "string" ? password : "";
  const safeRedirectTo = getSafeRedirectPath(redirectTo);

  if (!normalizedEmail || normalizedPassword.length < 6) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, redirectTo: safeRedirectTo });
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  });

  if (error || !data.user) {
    const message = error?.message?.toLowerCase().includes("email not confirmed")
      ? "Підтвердіть email — перевірте пошту або зареєструйтесь знову."
      : "Невірний email або пароль.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (isSupabaseAdminConfigured()) {
    const adminSupabase = await createAdminClient();
    const { error: profileError } = await adminSupabase.from("profiles").upsert({
      id: data.user.id,
      email: normalizedEmail,
      full_name: data.user.user_metadata?.full_name ?? normalizedEmail.split("@")[0],
      role: isAdminEmail(normalizedEmail) ? "admin" : "student",
    });

    if (profileError && !profileError.message.includes("public.profiles")) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }
  }

  response.cookies.delete("koban_demo_user");
  return response;
}
