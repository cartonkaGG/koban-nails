import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoAuthAllowed } from "@/lib/security/demo-auth";
import { sanitizeFullName, sanitizePhone } from "@/lib/security/profile";

export async function PUT(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const fullName = sanitizeFullName(body.full_name);
  const phone = sanitizePhone(body.phone);

  if (fullName === undefined && phone === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    if (!isDemoAuthAllowed()) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    return NextResponse.json({ ok: true, demo: true });
  }

  const updates: { full_name?: string | null; phone?: string | null } = {};
  if (fullName !== undefined) updates.full_name = fullName;
  if (phone !== undefined) updates.phone = phone;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
