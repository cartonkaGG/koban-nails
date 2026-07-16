import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSignupOrigin } from "@/lib/auth/signup-email";
import { sendEmail } from "@/lib/emails/send";
import { renderEmailLayout } from "@/lib/emails/templates";
import { applyAuthCookieDefaults } from "@/lib/supabase/cookies";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { getSafeRedirectPath } from "@/lib/security/redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSupabaseEnv,
  isAdminEmail,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/config";
import { isResendConfigured } from "@/lib/resend/config";

async function sendWelcomeEmail(params: {
  email: string;
  firstName: string;
  cabinetUrl: string;
}) {
  if (!isResendConfigured()) return;

  const template = {
    subject: "Ласкаво просимо — Koban nails",
    html: renderEmailLayout({
      preheader: "Ваш акаунт готовий — заходьте в кабінет.",
      title: "Реєстрація успішна",
      greeting: `${params.firstName}, вітаємо у Koban nails!`,
      paragraphs: [
        "Ваш акаунт уже створено і ви можете одразу користуватися особистим кабінетом.",
        "Обирайте курс, оплачуйте онлайн — доступ відкриється автоматично після успішної оплати.",
      ],
      ctaLabel: "Відкрити кабінет",
      ctaUrl: params.cabinetUrl,
      footerNote: "Якщо ви не реєструвались — проігноруйте цей лист.",
    }),
    text: [
      `${params.firstName}, вітаємо у Koban nails!`,
      "",
      "Акаунт створено. Відкрийте кабінет:",
      params.cabinetUrl,
    ].join("\n"),
  };

  const sent = await sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!sent.ok) {
    console.error("[register] welcome email failed:", sent.error);
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase admin key is not configured" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limited = rateLimit({ key: `register:${ip}`, limit: 10, windowMs: 60_000 });
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
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (!normalizedFirstName || !normalizedLastName) {
    return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  const { data: users, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 400 });
  }

  const existingUser = users.users.find(
    (user) => user.email?.toLowerCase() === normalizedEmail,
  );

  if (existingUser?.email_confirmed_at) {
    return NextResponse.json(
      { error: "Акаунт вже зареєстрований, увійдіть." },
      { status: 409 },
    );
  }

  // Clear stuck unconfirmed accounts so registration can complete + auto-login.
  if (existingUser && !existingUser.email_confirmed_at) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
  }

  const { data: createdUser, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: normalizedPassword,
    email_confirm: true,
    user_metadata: {
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      full_name: fullName,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (createdUser.user) {
    await supabase.from("profiles").upsert({
      id: createdUser.user.id,
      email: normalizedEmail,
      full_name: fullName,
      role: isAdminEmail(normalizedEmail) ? "admin" : "student",
    });
  }

  const { url, key } = getSupabaseEnv();
  const response = NextResponse.json({ ok: true, redirectTo: safeRedirectTo });

  const sessionSupabase = createServerClient(url, key, {
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

  const { error: signInError } = await sessionSupabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  });

  if (signInError) {
    return NextResponse.json(
      {
        error:
          "Акаунт створено, але автоматичний вхід не вдався. Увійдіть з тим самим email і паролем.",
      },
      { status: 400 },
    );
  }

  response.cookies.delete("koban_demo_user");

  // Non-blocking welcome email — registration must not wait on Resend.
  void sendWelcomeEmail({
    email: normalizedEmail,
    firstName: normalizedFirstName || fullName.split(" ")[0] || "Друже",
    cabinetUrl: `${origin}${safeRedirectTo}`,
  });

  return response;
}
