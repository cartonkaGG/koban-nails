import { createAdminClient } from "@/lib/supabase/admin";

export type SupportThreadStatus = "open" | "closed";

export async function getThreadStatus(userId: string): Promise<SupportThreadStatus> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("support_threads")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.status as SupportThreadStatus) ?? "open";
}

export async function openThread(userId: string) {
  const supabase = await createAdminClient();
  await supabase.from("support_threads").upsert({
    user_id: userId,
    status: "open",
    closed_at: null,
    closed_by: null,
    updated_at: new Date().toISOString(),
  });
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

export async function resolveUserFromTelegramReply(replyToMessageId?: number, replyText?: string) {
  if (!replyToMessageId && !replyText) return null;

  const supabase = await createAdminClient();

  if (replyToMessageId) {
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
  }

  if (replyText) {
    const tagged = replyText.match(/#user:([0-9a-f-]{36})/i);
    if (tagged?.[1]) return tagged[1];
  }

  return null;
}
