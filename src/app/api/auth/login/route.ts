import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSupabaseEnv,
  isAdminEmail,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

function getRedirectPath(value: unknown) {
  if (typeof value !== "string") return "/cabinet";
  if (!value.startsWith("/") || value.startsWith("//")) return "/cabinet";
  return value;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 400 });
  }

  const { email, password, redirectTo } = await request.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPassword = typeof password === "string" ? password : "";
  const safeRedirectTo = getRedirectPath(redirectTo);

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
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: "Невірний email або пароль." }, { status: 400 });
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
