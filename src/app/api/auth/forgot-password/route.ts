import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderResetPasswordEmail } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/emails/send";
import { buildEmailConfirmCallbackUrl } from "@/lib/auth/signup-email";
import { getSiteOrigin } from "@/lib/site-url";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { isResendConfigured } from "@/lib/resend/config";

const RESET_PASSWORD_PATH = "/auth/reset-password";

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 400 });
  }

  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: "Email service is not configured. Contact support." },
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  const limited = rateLimit({ key: `forgot-password:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { email } = await request.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const origin = getSiteOrigin(request);

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: normalizedEmail,
    options: {
      redirectTo: `${origin}${RESET_PASSWORD_PATH}`,
    },
  });

  // Always return the same message to avoid email enumeration.
  if (linkError || !linkData.properties?.hashed_token) {
    console.error("[forgot-password] generateLink:", linkError?.message ?? "missing hashed_token");
    return NextResponse.json({
      ok: true,
      message: "Якщо акаунт існує, ми надіслали лист для зміни пароля.",
    });
  }

  const firstName =
    (linkData.user?.user_metadata?.first_name as string | undefined) ??
    (linkData.user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    "";

  const resetUrl = buildEmailConfirmCallbackUrl({
    origin,
    tokenHash: linkData.properties.hashed_token,
    type: "recovery",
    next: RESET_PASSWORD_PATH,
  });

  const template = renderResetPasswordEmail({
    firstName,
    resetUrl,
  });

  await sendEmail({
    to: normalizedEmail,
    subject: template.subject,
    html: template.html,
  });

  return NextResponse.json({
    ok: true,
    message: "Якщо акаунт існує, ми надіслали лист для зміни пароля.",
  });
}
