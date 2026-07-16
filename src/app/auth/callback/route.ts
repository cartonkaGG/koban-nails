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

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/?auth=login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const next = searchParams.get("next");
  const origin = new URL(request.url).origin;
  const safeNext = getSafeRedirectPath(next);

  // Hash-based tokens (#access_token=...) never reach the server — send a
  // tiny HTML bridge that moves them into the session via the browser client.
  if (!code && !tokenHash) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Вхід…</title>
</head>
<body style="font-family: system-ui, sans-serif; background:#070806; color:#f4eddf; display:grid; place-items:center; min-height:100vh; margin:0;">
  <p>Завершуємо вхід…</p>
  <script>
    (function () {
      var hash = window.location.hash ? window.location.hash.slice(1) : "";
      var params = new URLSearchParams(hash);
      var access_token = params.get("access_token");
      var refresh_token = params.get("refresh_token");
      var nextPath = ${JSON.stringify(safeNext)};
      if (!access_token || !refresh_token) {
        window.location.replace(${JSON.stringify(`${origin}/?auth=login&error=auth`)});
        return;
      }
      fetch("/auth/callback/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: access_token, refresh_token: refresh_token, next: nextPath })
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          window.location.replace((data && data.redirectTo) || nextPath || "/cabinet");
        });
      }).catch(function () {
        window.location.replace(${JSON.stringify(`${origin}/?auth=login&error=auth`)});
      });
    })();
  </script>
</body>
</html>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
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

  let user = null;

  if (tokenHash && otpType) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as "signup" | "email" | "recovery" | "invite" | "magiclink" | "email_change",
    });

    if (error || !data.user) {
      console.error("[auth/callback] verifyOtp failed:", error?.message);
      return NextResponse.redirect(`${origin}/?auth=login&error=auth`);
    }

    user = data.user;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error("[auth/callback] exchangeCode failed:", error?.message);
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
