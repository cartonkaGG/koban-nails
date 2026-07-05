import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { closeThread, getLastTelegramMessageId, getThreadStatus } from "@/lib/support/threads";
import { notifySupportChatClosed } from "@/lib/telegram/send";

export async function POST() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true, status: "closed" });
  }

  await closeThread(profile.id, "user");

  const replyToMessageId = await getLastTelegramMessageId(profile.id);
  await notifySupportChatClosed({
    userId: profile.id,
    userName: profile.full_name ?? profile.email,
    email: profile.email,
    closedBy: "user",
    replyToMessageId,
  });

  return NextResponse.json({ ok: true, status: "closed", messages: [] });
}

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = isSupabaseConfigured() ? await getThreadStatus(profile.id) : "open";
  return NextResponse.json({ status });
}
