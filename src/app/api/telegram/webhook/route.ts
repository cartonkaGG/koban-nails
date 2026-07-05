import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTelegramConfigured } from "@/lib/telegram/config";

type TelegramUpdate = {
  message?: {
    text?: string;
    message_id?: number;
    reply_to_message?: {
      text?: string;
    };
  };
};

function extractUserId(text?: string) {
  if (!text) return null;
  const match = text.match(/🆔\s*<code>([^<]+)<\/code>|🆔\s*([0-9a-f-]{36})/i);
  return match?.[1] ?? match?.[2] ?? null;
}

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
  const replyTo = update.message?.reply_to_message?.text;
  const userId = extractUserId(replyTo);

  if (!replyText || !userId) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createAdminClient();
  await supabase.from("support_messages").insert({
    user_id: userId,
    body: replyText,
    direction: "admin",
    telegram_message_id: update.message?.message_id ?? null,
  });

  return NextResponse.json({ ok: true });
}
