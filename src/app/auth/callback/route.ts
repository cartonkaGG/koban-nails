import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyAuthCookieDefaults } from "@/lib/supabase/cookies";
import { getSafeRedirectPath } from "@/lib/security/redirect";
import { getSupabaseEnv, isAdminEmail, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/?auth=login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const origin = new URL(request.url).origin;
  const safeNext = getSafeRedirectPath(next);

  if (!code && !searchParams.get("token_hash")) {
    return NextResponse.redirect(`${origin}/?auth=login&error=auth`);
  }

  const redirectUrl = `${origin}${safeNext}`;
  const response = NextResponse.redirect(redirectUrl);
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

  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");

  let user = null;

  if (tokenHash && otpType) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as "signup" | "email" | "recovery" | "invite" | "magiclink" | "email_change",
    });

    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/?auth=login&error=auth`);
    }

    user = data.user;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/?auth=login&error=auth`);
    }

    user = data.user;
  }

  if (!user) {
    return NextResponse.redirect(`${origin}/?auth=login&error=auth`);
  }

  if (user.email && isSupabaseAdminConfigured()) {
    const adminSupabase = await createAdminClient();
    const email = user.email.toLowerCase();
    await adminSupabase.from("profiles").upsert({
      id: user.id,
      email,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ?? email.split("@")[0],
      role: isAdminEmail(email) ? "admin" : "student",
    });
  }

  response.cookies.delete("koban_demo_user");
  return response;
}
