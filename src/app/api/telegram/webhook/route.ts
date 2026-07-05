import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTelegramConfigured } from "@/lib/telegram/config";

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

function extractUserIdFromText(text?: string) {
  if (!text) return null;

  const tagged = text.match(/#user:([0-9a-f-]{36})/i);
  if (tagged?.[1]) return tagged[1];

  const uuid = text.match(/[0-9a-f]{8}-[0-9a-f-]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return uuid?.[0] ?? null;
}

async function resolveUserId(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  replyToMessageId?: number,
  replyText?: string,
) {
  if (replyToMessageId) {
    const { data } = await supabase
      .from("support_messages")
      .select("user_id")
      .eq("telegram_message_id", replyToMessageId)
      .maybeSingle();

    if (data?.user_id) return data.user_id;
  }

  return extractUserIdFromText(replyText);
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
  const replyTo = update.message?.reply_to_message;

  if (!replyText || replyText.startsWith("/")) {
    return NextResponse.json({ ok: true });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createAdminClient();
  const userId = await resolveUserId(supabase, replyTo?.message_id, replyTo?.text);

  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("support_messages").insert({
    user_id: userId,
    body: replyText,
    direction: "admin",
    telegram_message_id: update.message?.message_id ?? null,
    read_at: null,
  });

  if (error) {
    console.error("telegram webhook insert:", error.message);
  }

  return NextResponse.json({ ok: true });
}
