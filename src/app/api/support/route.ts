import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySupportMessage } from "@/lib/telegram/send";
import {
  closeThread,
  getThreadStatus,
  linkTelegramMessage,
  openThread,
} from "@/lib/support/threads";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ messages: [], unreadCount: 0, status: "open" });
  }

  const supabase = await createAdminClient();
  const status = await getThreadStatus(profile.id);

  const [{ data, error }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("support_messages")
      .select("id, body, direction, created_at, read_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("direction", "admin")
      .is("read_at", null),
  ]);

  if (error) {
    return NextResponse.json({ messages: [], unreadCount: 0, status });
  }

  const messages = (data ?? []).filter((m) => !m.body.startsWith("— Чат завершено"));

  return NextResponse.json({
    messages,
    unreadCount: unreadCount ?? 0,
    status,
  });
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

  const status = await getThreadStatus(profile.id);
  if (status === "closed") {
    await openThread(profile.id);
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

  await openThread(profile.id);

  const telegram = await notifySupportMessage({
    userId: profile.id,
    userName: profile.full_name ?? profile.email,
    email: profile.email,
    body: text,
  });

  if (telegram.messageId) {
    await linkTelegramMessage(telegram.messageId, profile.id);
    if (saved?.id) {
      await supabase
        .from("support_messages")
        .update({ telegram_message_id: telegram.messageId })
        .eq("id", saved.id);
    }
  }

  return NextResponse.json({ ok: true, status: "open" });
}
