import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { closeThread, getThreadStatus } from "@/lib/support/threads";

export async function POST() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  await closeThread(profile.id, "user");

  const supabase = await createAdminClient();
  await supabase.from("support_messages").insert({
    user_id: profile.id,
    body: "— Чат завершено учнем —",
    direction: "admin",
    read_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, status: "closed" });
}

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = isSupabaseConfigured() ? await getThreadStatus(profile.id) : "open";
  return NextResponse.json({ status });
}
