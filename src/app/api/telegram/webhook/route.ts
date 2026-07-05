import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  closeThread,
  linkTelegramMessage,
  resolveUserFromTelegramReply,
} from "@/lib/support/threads";
import { isTelegramConfigured } from "@/lib/telegram/config";
import { sendTelegramMessage } from "@/lib/telegram/send";

type TelegramUpdate = {
  message?: {
    text?: string;
    message_id?: number;
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const update = (await request.json()) as TelegramUpdate;
  const replyText = update.message?.text?.trim();
  const replyTo = update.message?.reply_to_message;
  const messageId = update.message?.message_id;

  if (!replyText || !messageId) {
    return NextResponse.json({ ok: true });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const userId = await resolveUserFromTelegramReply(replyTo?.message_id, replyTo?.text);
  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  const normalized = replyText.toLowerCase();

  if (normalized === "/close" || normalized === "close" || normalized === "закрити") {
    await closeThread(userId, "admin");

    const supabase = await createAdminClient();
    await supabase.from("support_messages").insert({
      user_id: userId,
      body: "— Чат завершено підтримкою —",
      direction: "admin",
      read_at: null,
    });

    await sendTelegramMessage("✅ Чат з учнем завершено.");
    return NextResponse.json({ ok: true });
  }

  if (replyText.startsWith("/")) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from("support_messages").insert({
    user_id: userId,
    body: replyText,
    direction: "admin",
    telegram_message_id: messageId,
    read_at: null,
  });

  if (error) {
    console.error("telegram webhook insert:", error.message);
    return NextResponse.json({ ok: true });
  }

  await linkTelegramMessage(messageId, userId);

  return NextResponse.json({ ok: true });
}
