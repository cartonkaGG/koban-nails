import { NextResponse } from "next/server";
import { isSupabaseConfigured, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { actorTag, enrichActor, stripActorTagsFromText } from "@/lib/support/actor";
import {
  closeThread,
  forceOpenThread,
  insertAdminSupportMessage,
  isAdminTelegramChat,
  linkTelegramMessage,
  resolveSupportActorFromTelegramUpdate,
} from "@/lib/support/threads";
import { getTelegramConfig, isTelegramConfigured } from "@/lib/telegram/config";
import { notifySupportChatClosed, sendTelegramMessage } from "@/lib/telegram/send";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

type TelegramUpdate = {
  message?: {
    text?: string;
    caption?: string;
    message_id?: number;
    chat?: { id?: number };
    reply_to_message?: {
      text?: string;
      caption?: string;
      message_id?: number;
      reply_to_message?: {
        text?: string;
        caption?: string;
        message_id?: number;
      };
    };
  };
};

async function getTelegramWebhookInfo() {
  if (!isTelegramConfigured()) return null;

  try {
    const { token } = getTelegramConfig();
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, {
      cache: "no-store",
    });
    const data = (await res.json()) as {
      ok: boolean;
      result?: {
        url?: string;
        pending_update_count?: number;
        last_error_date?: number;
        last_error_message?: string;
      };
    };
    if (!data.ok || !data.result) return null;

    return {
      url: data.result.url ?? "",
      pendingUpdates: data.result.pending_update_count ?? 0,
      lastErrorDate: data.result.last_error_date ?? null,
      lastErrorMessage: data.result.last_error_message ?? null,
    };
  } catch {
    return null;
  }
}

async function syncTelegramWebhook(request: Request, secret: string) {
  try {
    const { token } = getTelegramConfig();
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: request.url,
        secret_token: secret,
      }),
      cache: "no-store",
    });
    const data = (await res.json()) as { ok?: boolean; description?: string };

    if (!res.ok || !data.ok) {
      console.error("telegram webhook: setWebhook failed", {
        status: res.status,
        description: data.description ?? "Unknown Telegram error",
      });
      return false;
    }

    console.info("telegram webhook: secret synchronized");
    return true;
  } catch (error) {
    console.error("telegram webhook: setWebhook request failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const header = request.headers.get("x-telegram-bot-api-secret-token")?.trim();

  if (isTelegramConfigured()) {
    if (!secret) {
      console.error("telegram webhook: TELEGRAM_WEBHOOK_SECRET is required when Telegram is configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
    }
    if (header !== secret) {
      const synchronized = await syncTelegramWebhook(request, secret);
      if (synchronized) {
        return NextResponse.json({ ok: true, reconfigured: true });
      }

      console.error("telegram webhook: secret mismatch", {
        hasHeader: Boolean(header),
        hasEnvSecret: Boolean(secret),
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({ ok: true, skipped: "telegram_not_configured" });
  }

  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    console.error("telegram webhook: supabase admin not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const replyText = update.message?.text?.trim() || update.message?.caption?.trim();
  const replyTo = update.message?.reply_to_message;
  const messageId = update.message?.message_id;
  const chatId = update.message?.chat?.id;

  if (!replyText || !messageId) {
    return NextResponse.json({ ok: true, skipped: "not_a_text_message" });
  }

  let actor = await resolveSupportActorFromTelegramUpdate({
    chatId,
    replyTo,
    messageText: replyText,
  });

  if (!actor) {
    console.error("telegram webhook: actor not resolved", {
      chatId,
      replyToMessageId: replyTo?.message_id,
      hasReplyText: Boolean(replyTo?.text || replyTo?.caption),
    });

    if (isAdminTelegramChat(chatId)) {
      await sendTelegramMessage(
        [
          "⚠️ <b>Не вдалося визначити користувача</b>",
          "",
          "Натисніть <b>Reply</b> саме на повідомлення бота з тегом",
          "<code>#user:...</code> або <code>#guest:...</code>,",
          "потім напишіть відповідь.",
        ].join("\n"),
        { replyToMessageId: messageId },
      );
    }

    return NextResponse.json({ ok: true, skipped: "actor_not_resolved" });
  }

  actor = await enrichActor(actor);

  const normalized = replyText.toLowerCase();

  if (normalized === "/close" || normalized === "close" || normalized === "закрити") {
    await closeThread(actor, "admin");

    if (actor.type === "user") {
      const supabase = await createAdminClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", actor.id)
        .maybeSingle();

      if (profile) {
        actor = {
          type: "user",
          id: actor.id,
          name: profile.full_name ?? profile.email,
          email: profile.email,
        };
      }
    }

    const closed = await notifySupportChatClosed({
      actorTag: actorTag(actor),
      userName: actor.name,
      email: actor.type === "user" ? actor.email : undefined,
      isGuest: actor.type === "guest",
      closedBy: "admin",
      replyToMessageId: replyTo?.message_id,
    });

    if (closed.messageId) {
      await linkTelegramMessage(closed.messageId, actor);
    }

    return NextResponse.json({ ok: true, closed: true, actor: actor.type });
  }

  if (replyText.startsWith("/")) {
    return NextResponse.json({ ok: true, skipped: "command_ignored" });
  }

  await forceOpenThread(actor);

  const bodyForUser = stripActorTagsFromText(replyText) || replyText;

  const inserted = await insertAdminSupportMessage({
    actor,
    body: bodyForUser,
    telegramMessageId: messageId,
  });

  if (!inserted.ok) {
    console.error("telegram webhook insert:", inserted.error);
    return NextResponse.json({ error: inserted.error }, { status: 500 });
  }

  await linkTelegramMessage(messageId, actor);

  return NextResponse.json({ ok: true, saved: true, actor: actor.type });
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const webhook = await getTelegramWebhookInfo();

  return NextResponse.json({
    ok: true,
    telegram: isTelegramConfigured(),
    supabaseAdmin: isSupabaseAdminConfigured(),
    webhookSecretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET?.trim()),
    webhook,
    hint:
      webhook?.lastErrorMessage ??
      (webhook?.url
        ? null
        : "Webhook URL is empty — run setWebhook (see .env.example step 3)"),
  });
}
