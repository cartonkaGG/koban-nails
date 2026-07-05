import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createAdminClient();
  await supabase
    .from("support_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .eq("direction", "admin")
    .is("read_at", null);

  return NextResponse.json({ ok: true });
}
