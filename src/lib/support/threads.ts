import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export type SupportThreadStatus = "open" | "closed";

export type SupportThreadInfo = {
  status: SupportThreadStatus;
  sessionStartedAt: string | null;
  available: boolean;
};

const SESSION_EPOCH = "1970-01-01T00:00:00.000Z";

const DEFAULT_THREAD: SupportThreadInfo = {
  status: "open",
  sessionStartedAt: null,
  available: false,
};

export function shouldFilterBySession(sessionStartedAt: string | null) {
  if (!sessionStartedAt) return false;
  return new Date(sessionStartedAt).getTime() > new Date(SESSION_EPOCH).getTime() + 86_400_000;
}

export async function getThreadInfo(userId: string): Promise<SupportThreadInfo> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("support_threads")
    .select("status, session_started_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return DEFAULT_THREAD;
  }

  if (!data) {
    return { status: "open", sessionStartedAt: null, available: true };
  }

  return {
    status: (data.status as SupportThreadStatus) ?? "open",
    sessionStartedAt: data.session_started_at ?? null,
    available: true,
  };
}

export async function getThreadStatus(userId: string): Promise<SupportThreadStatus> {
  const { status } = await getThreadInfo(userId);
  return status;
}

/** Start a new visible session only when reopening a closed chat. */
export async function openThread(userId: string) {
  const supabase = await createAdminClient();
  const { data: existing, error } = await supabase
    .from("support_threads")
    .select("status, session_started_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return;

  const now = new Date().toISOString();
  const reopening = existing?.status === "closed";

  if (!existing) {
    await supabase.from("support_threads").insert({
      user_id: userId,
      status: "open",
      session_started_at: SESSION_EPOCH,
      updated_at: now,
    });
    return;
  }

  if (!reopening) return;

  await supabase
    .from("support_threads")
    .update({
      status: "open",
      closed_at: null,
      closed_by: null,
      session_started_at: now,
      updated_at: now,
    })
    .eq("user_id", userId);
}

export async function closeThread(userId: string, closedBy: "user" | "admin") {
  const supabase = await createAdminClient();
  await supabase.from("support_threads").upsert({
    user_id: userId,
    status: "closed",
    closed_at: new Date().toISOString(),
    closed_by: closedBy,
    updated_at: new Date().toISOString(),
  });
}

export async function linkTelegramMessage(telegramMessageId: number, userId: string) {
  const supabase = await createAdminClient();
  await supabase.from("support_tg_links").upsert({
    telegram_message_id: telegramMessageId,
    user_id: userId,
  });
}

export async function getLastTelegramMessageId(userId: string): Promise<number | null> {
  const supabase = await createAdminClient();

  const { data: linked } = await supabase
    .from("support_tg_links")
    .select("telegram_message_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linked?.telegram_message_id) {
    return linked.telegram_message_id;
  }

  const { data: msg } = await supabase
    .from("support_messages")
    .select("telegram_message_id")
    .eq("user_id", userId)
    .not("telegram_message_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return msg?.telegram_message_id ?? null;
}

export function extractUserIdFromText(text?: string | null) {
  if (!text) return null;
  const tagged = text.match(/#user:([0-9a-f-]{36})/i);
  return tagged?.[1] ?? null;
}

export async function resolveUserFromTelegramReply(
  replyToMessageId?: number,
  replyText?: string,
  messageText?: string,
) {
  const fromMessage = extractUserIdFromText(messageText);
  if (fromMessage) return fromMessage;

  const fromReply = extractUserIdFromText(replyText);
  if (fromReply) return fromReply;

  if (!replyToMessageId) return null;

  const supabase = await createAdminClient();

  const { data: link } = await supabase
    .from("support_tg_links")
    .select("user_id")
    .eq("telegram_message_id", replyToMessageId)
    .maybeSingle();

  if (link?.user_id) return link.user_id;

  const { data: msg } = await supabase
    .from("support_messages")
    .select("user_id")
    .eq("telegram_message_id", replyToMessageId)
    .maybeSingle();

  if (msg?.user_id) return msg.user_id;

  return null;
}

export async function insertAdminSupportMessage(params: {
  userId: string;
  body: string;
  telegramMessageId: number;
}) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "service_role_missing" };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from("support_messages").insert({
    user_id: params.userId,
    body: params.body,
    direction: "admin",
    telegram_message_id: params.telegramMessageId,
    read_at: null,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
