import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySupportMessage } from "@/lib/telegram/send";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ messages: [] });
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("support_messages")
    .select("id, body, direction, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ messages: [] });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { body } = await request.json();
  const text = typeof body === "string" ? body.trim() : "";
  if (text.length < 1 || text.length > 2000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    await notifySupportMessage({
      userId: profile.id,
      userName: profile.full_name ?? profile.email,
      email: profile.email,
      body: text,
    });
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createAdminClient();
  const { data: saved, error } = await supabase
    .from("support_messages")
    .insert({
      user_id: profile.id,
      body: text,
      direction: "user",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const telegram = await notifySupportMessage({
    userId: profile.id,
    userName: profile.full_name ?? profile.email,
    email: profile.email,
    body: text,
  });

  if (telegram.messageId && saved?.id) {
    await supabase
      .from("support_messages")
      .update({ telegram_message_id: telegram.messageId })
      .eq("id", saved.id);
  }

  return NextResponse.json({ ok: true });
}
