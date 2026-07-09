import { getTelegramConfig, isTelegramConfigured } from "@/lib/telegram/config";

type SendResult = { ok: boolean; messageId?: number; error?: string };

export async function sendTelegramMessage(
  text: string,
  options?: { replyToMessageId?: number },
): Promise<SendResult> {
  if (!isTelegramConfigured()) return { ok: false, error: "not_configured" };

  try {
    const { token, chatId } = getTelegramConfig();
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_to_message_id: options?.replyToMessageId,
      }),
    });

    const data = (await res.json()) as {
      ok: boolean;
      result?: { message_id: number };
      description?: string;
    };

    if (!data.ok) {
      return { ok: false, error: data.description ?? "telegram_error" };
    }

    return { ok: true, messageId: data.result?.message_id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "telegram_error" };
  }
}

export async function notifyPurchase(params: {
  userName: string;
  email: string;
  courseTitle: string;
  priceUah: number;
}) {
  const text = [
    "🛒 <b>Нова покупка</b>",
    "",
    `👤 ${escapeHtml(params.userName)}`,
    `📧 ${escapeHtml(params.email)}`,
    `📚 ${escapeHtml(params.courseTitle)}`,
    `💰 ${params.priceUah.toLocaleString("uk-UA")} ₴`,
  ].join("\n");

  await sendTelegramMessage(text);
}

export async function notifyPurchaseRequest(params: {
  userName: string;
  email: string;
  courseTitle: string;
  priceUah: number;
}) {
  const text = [
    "⏳ <b>Заявка на оплату курсу</b>",
    "",
    `👤 ${escapeHtml(params.userName)}`,
    `📧 ${escapeHtml(params.email)}`,
    `📚 ${escapeHtml(params.courseTitle)}`,
    `💰 ${params.priceUah.toLocaleString("uk-UA")} ₴`,
    "",
    "Підтвердіть оплату в адмін-панелі → Учні.",
  ].join("\n");

  await sendTelegramMessage(text);
}

export async function notifySupportMessage(params: {
  actorTag: string;
  userName: string;
  email?: string;
  isGuest?: boolean;
  body: string;
}) {
  const lines = [
    "💬 <b>Підтримка</b>",
    `👤 ${escapeHtml(params.userName)}`,
  ];

  if (params.isGuest) {
    lines.push("🌐 Гість (без акаунту)");
  } else if (params.email) {
    lines.push(`📧 ${escapeHtml(params.email)}`);
  }

  lines.push(
    `<code>${escapeHtml(params.actorTag)}</code>`,
    "",
    escapeHtml(params.body),
    "",
    "↩️ Reply на це повідомлення",
    "/close — завершити чат",
  );

  return sendTelegramMessage(lines.join("\n"));
}

export async function notifySupportChatClosed(params: {
  actorTag: string;
  userName: string;
  email?: string;
  isGuest?: boolean;
  closedBy: "user" | "admin";
  replyToMessageId?: number | null;
}) {
  const who =
    params.closedBy === "user"
      ? "Користувач завершив цей чат."
      : "Чат завершено підтримкою.";

  const lines = [
    "🔴 <b>Чат завершено</b>",
    "",
    `👤 ${escapeHtml(params.userName)}`,
  ];

  if (params.isGuest) {
    lines.push("🌐 Гість (без акаунту)");
  } else if (params.email) {
    lines.push(`📧 ${escapeHtml(params.email)}`);
  }

  lines.push(`<code>${escapeHtml(params.actorTag)}</code>`, "", who);

  return sendTelegramMessage(lines.join("\n"), {
    replyToMessageId: params.replyToMessageId ?? undefined,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
