import { NextRequest, NextResponse } from "next/server";
import { sendSignupConfirmationEmail, getSignupOrigin } from "@/lib/auth/signup-email";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { getSafeRedirectPath } from "@/lib/security/redirect";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { isResendConfigured } from "@/lib/resend/config";

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 400 });
  }

  if (!isResendConfigured()) {
    return NextResponse.json({ error: "Email service is not configured" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const limited = rateLimit({ key: `resend-confirmation:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { email, password, redirectTo, firstName, lastName } = await request.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPassword = typeof password === "string" ? password : "";
  const normalizedFirstName = typeof firstName === "string" ? firstName.trim() : "";
  const normalizedLastName = typeof lastName === "string" ? lastName.trim() : "";
  const safeRedirectTo = getSafeRedirectPath(redirectTo);
  const origin = getSignupOrigin(request);
  const fullName =
    normalizedFirstName && normalizedLastName
      ? `${normalizedFirstName} ${normalizedLastName}`
      : normalizedFirstName || normalizedLastName || normalizedEmail.split("@")[0];

  if (!normalizedEmail || normalizedPassword.length < 6) {
    return NextResponse.json({ error: "Вкажіть email і пароль" }, { status: 400 });
  }

  const emailResult = await sendSignupConfirmationEmail({
    email: normalizedEmail,
    password: normalizedPassword,
    firstName: normalizedFirstName || fullName.split(" ")[0] || "Друже",
    lastName: normalizedLastName,
    fullName,
    redirectTo: safeRedirectTo,
    origin,
    deleteUnconfirmed: true,
  });

  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: `Лист повторно надіслано на ${normalizedEmail}. Перевірте «Вхідні» та «Спам».`,
  });
}
