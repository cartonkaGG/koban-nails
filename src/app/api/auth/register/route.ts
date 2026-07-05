import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSupabaseEnv,
  isAdminEmail,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/config";

function getRedirectPath(value: unknown) {
  if (typeof value !== "string") return "/cabinet";
  if (!value.startsWith("/") || value.startsWith("//")) return "/cabinet";
  return value;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase admin key is not configured" }, { status: 400 });
  }

  const { email, password, redirectTo, repairUnconfirmedOnly } = await request.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPassword = typeof password === "string" ? password : "";
  const safeRedirectTo = getRedirectPath(redirectTo);

  if (!normalizedEmail || normalizedPassword.length < 6) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 400 });
  }

  const existingUser = users.users.find((user) => user.email?.toLowerCase() === normalizedEmail);

  if (!existingUser && repairUnconfirmedOnly) {
    return NextResponse.json({ error: "Account was not found" }, { status: 404 });
  }

  if (existingUser) {
    if (existingUser.email_confirmed_at) {
      return NextResponse.json(
        { error: "Акаунт вже зареєстрований, увійдіть." },
        { status: 409 },
      );
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
  }

  const response = NextResponse.json({ ok: true, redirectTo: safeRedirectTo });
  const { data: createdUser, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: normalizedPassword,
    email_confirm: true,
    user_metadata: {
      full_name: normalizedEmail.split("@")[0],
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (createdUser.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: createdUser.user.id,
      email: normalizedEmail,
      full_name: normalizedEmail.split("@")[0],
      role: isAdminEmail(normalizedEmail) ? "admin" : "student",
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }
  }

  const { url, key } = getSupabaseEnv();
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
