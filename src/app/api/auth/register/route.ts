import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase admin key is not configured" }, { status: 400 });
  }

  const { email, password, repairUnconfirmedOnly } = await request.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPassword = typeof password === "string" ? password : "";

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

  const { error } = await supabase.auth.admin.createUser({
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

  return NextResponse.json({ ok: true });
}
