import { NextRequest, NextResponse } from "next/server";
import { sendSignupConfirmationEmail, getSignupOrigin } from "@/lib/auth/signup-email";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { isResendConfigured } from "@/lib/resend/config";

function getRedirectPath(value: unknown) {
  if (typeof value !== "string") return "/cabinet";
  if (!value.startsWith("/") || value.startsWith("//")) return "/cabinet";
  return value;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase admin key is not configured" }, { status: 400 });
  }

  const { email, password, redirectTo, repairUnconfirmedOnly, firstName, lastName } =
    await request.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPassword = typeof password === "string" ? password : "";
  const normalizedFirstName = typeof firstName === "string" ? firstName.trim() : "";
  const normalizedLastName = typeof lastName === "string" ? lastName.trim() : "";
  const safeRedirectTo = getRedirectPath(redirectTo);
  const origin = getSignupOrigin(request);
  const fullName =
    normalizedFirstName && normalizedLastName
      ? `${normalizedFirstName} ${normalizedLastName}`
      : normalizedFirstName || normalizedLastName || normalizedEmail.split("@")[0];

  if (!normalizedEmail || normalizedPassword.length < 6) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (!repairUnconfirmedOnly && (!normalizedFirstName || !normalizedLastName)) {
    return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
  }

  const useEmailConfirmation = isResendConfigured();

  if (useEmailConfirmation) {
    const emailResult = await sendSignupConfirmationEmail({
      email: normalizedEmail,
      password: normalizedPassword,
      firstName: normalizedFirstName || fullName.split(" ")[0] || "Друже",
      lastName: normalizedLastName,
      fullName,
      redirectTo: safeRedirectTo,
      origin,
      deleteUnconfirmed: !repairUnconfirmedOnly,
    });

    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      needsEmailConfirmation: true,
      message: `Лист надіслано на ${normalizedEmail}. Відкрийте його та натисніть «Підтвердити email». Перевірте також папку «Спам».`,
    });
  }

  const { createServerClient } = await import("@supabase/ssr");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { getSupabaseEnv, isAdminEmail } = await import("@/lib/supabase/config");

  const supabase = await createAdminClient();
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 400 });
  }

  const existingUser = users.users.find((user) => user.email?.toLowerCase() === normalizedEmail);

  if (!existingUser && repairUnconfirmedOnly) {
    return NextResponse.json({ error: "Account was not found" }, { status: 404 });
  }

  if (existingUser?.email_confirmed_at) {
    return NextResponse.json(
      { error: "Акаунт вже зареєстрований, увійдіть." },
      { status: 409 },
    );
  }

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
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: signInError } = await sessionSupabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  });

  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 400 });
  }

  response.cookies.delete("koban_demo_user");
  return response;
}
