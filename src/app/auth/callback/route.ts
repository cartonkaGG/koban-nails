import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/?auth=login", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cabinet";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email && isSupabaseAdminConfigured()) {
      const adminSupabase = await createAdminClient();
      const email = data.user.email.toLowerCase();
      await adminSupabase.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name:
          (data.user.user_metadata?.full_name as string | undefined) ??
          email.split("@")[0],
        role: isAdminEmail(email) ? "admin" : "student",
      });
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth=login&error=auth`);
}
