import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  closeThread,
  getThreadInfo,
  insertAdminSupportMessage,
  linkTelegramMessage,
  openThread,
  resolveUserFromTelegramReply,
} from "@/lib/support/threads";
import { isTelegramConfigured } from "@/lib/telegram/config";
import { notifySupportChatClosed } from "@/lib/telegram/send";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

type TelegramUpdate = {
  message?: {
    text?: string;
    message_id?: number;
    chat?: { id?: number };
    reply_to_message?: {
      text?: string;
      message_id?: number;
    };
  };
};

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      console.error("telegram webhook: forbidden (secret mismatch)");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({ ok: true, skipped: "telegram_not_configured" });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: "supabase_not_configured" });
  }

  if (!isSupabaseAdminConfigured()) {
    console.error("telegram webhook: SUPABASE_SERVICE_ROLE_KEY is missing on server");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const replyText = update.message?.text?.trim();
  const replyTo = update.message?.reply_to_message;
  const messageId = update.message?.message_id;

  if (!replyText || !messageId) {
    return NextResponse.json({ ok: true, skipped: "not_a_text_message" });
  }

  const userId = await resolveUserFromTelegramReply(
    replyTo?.message_id,
    replyTo?.text,
    replyText,
  );

  if (!userId) {
    console.error("telegram webhook: could not resolve user", {
      replyToMessageId: replyTo?.message_id,
      hasReplyText: Boolean(replyTo?.text),
    });
    return NextResponse.json({ ok: true, skipped: "user_not_resolved" });
  }

  const normalized = replyText.toLowerCase();

  if (normalized === "/close" || normalized === "close" || normalized === "закрити") {
    await closeThread(userId, "admin");

    const supabase = await createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    const closed = await notifySupportChatClosed({
      userId,
      userName: profile?.full_name ?? profile?.email ?? "Користувач",
      email: profile?.email ?? "",
      closedBy: "admin",
      replyToMessageId: replyTo?.message_id,
    });

    if (closed.messageId) {
      await linkTelegramMessage(closed.messageId, userId);
    }

    return NextResponse.json({ ok: true, closed: true });
  }

  if (replyText.startsWith("/")) {
    return NextResponse.json({ ok: true, skipped: "command_ignored" });
  }

  const thread = await getThreadInfo(userId);
  if (thread.status === "closed") {
    await openThread(userId);
  }

  const inserted = await insertAdminSupportMessage({
    userId,
    body: replyText,
    telegramMessageId: messageId,
  });

  if (!inserted.ok) {
    console.error("telegram webhook insert:", inserted.error);
    return NextResponse.json({ error: inserted.error }, { status: 500 });
  }

  await linkTelegramMessage(messageId, userId);

  return NextResponse.json({ ok: true, saved: true, userId });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    telegram: isTelegramConfigured(),
    supabaseAdmin: isSupabaseAdminConfigured(),
  });
}
