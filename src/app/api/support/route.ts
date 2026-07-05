import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySupportMessage } from "@/lib/telegram/send";
import {
  countUnreadAdminMessages,
  forceOpenThread,
  getThreadInfo,
  linkTelegramMessage,
  openThread,
  shouldFilterBySession,
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
  let thread = await getThreadInfo(profile.id);

  if (thread.available && thread.status === "closed") {
    const pending = await countUnreadAdminMessages(profile.id);
    if (pending > 0) {
      await forceOpenThread(profile.id);
      thread = await getThreadInfo(profile.id);
    } else {
      return NextResponse.json({
        messages: [],
        unreadCount: 0,
        status: "closed",
      });
    }
  }

  let query = supabase
    .from("support_messages")
    .select("id, body, direction, created_at, read_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(100);

  const filterSession = thread.available && shouldFilterBySession(thread.sessionStartedAt);

  if (filterSession && thread.sessionStartedAt) {
    query = query.gte("created_at", thread.sessionStartedAt);
  }

  const since =
    filterSession && thread.sessionStartedAt
      ? thread.sessionStartedAt
      : "1970-01-01T00:00:00.000Z";

  const [{ data, error }, { count: unreadCount }] = await Promise.all([
    query,
    supabase
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("direction", "admin")
      .is("read_at", null)
      .gte("created_at", since),
  ]);

  if (error) {
    return NextResponse.json({ messages: [], unreadCount: 0, status: thread.status });
  }

  const messages = (data ?? []).filter((m) => !m.body.startsWith("— Чат завершено"));

  return NextResponse.json({
    messages,
    unreadCount: unreadCount ?? 0,
    status: thread.status,
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

  const thread = await getThreadInfo(profile.id);
  if (thread.status === "closed") {
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

  await forceOpenThread(profile.id);

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
