import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { getTelegramConfig } from "@/lib/telegram/config";
import {
  extractActorFromText,
  type SupportActor,
} from "@/lib/support/actor";

export type SupportThreadStatus = "open" | "closed";

export type SupportThreadInfo = {
  status: SupportThreadStatus;
  sessionStartedAt: string | null;
  available: boolean;
};

export const SUPPORT_SESSION_EPOCH = "1970-01-01T00:00:00.000Z";
const SESSION_EPOCH = SUPPORT_SESSION_EPOCH;

const DEFAULT_THREAD: SupportThreadInfo = {
  status: "open",
  sessionStartedAt: null,
  available: false,
};

function threadTable(actor: SupportActor) {
  return actor.type === "user" ? "support_threads" : "support_guest_threads";
}

function threadIdColumn(actor: SupportActor) {
  return actor.type === "user" ? "user_id" : "guest_id";
}

function messageIdColumn(actor: SupportActor) {
  return actor.type === "user" ? "user_id" : "guest_id";
}

export function shouldFilterBySession(sessionStartedAt: string | null) {
  if (!sessionStartedAt) return false;
  return new Date(sessionStartedAt).getTime() > new Date(SESSION_EPOCH).getTime() + 86_400_000;
}

export async function getThreadInfo(actor: SupportActor): Promise<SupportThreadInfo> {
  const supabase = await createAdminClient();
  const table = threadTable(actor);
  const idCol = threadIdColumn(actor);

  const { data, error } = await supabase
    .from(table)
    .select("status, session_started_at")
    .eq(idCol, actor.id)
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

export async function getThreadStatus(actor: SupportActor): Promise<SupportThreadStatus> {
  const { status } = await getThreadInfo(actor);
  return status;
}

export async function forceOpenThread(actor: SupportActor) {
  const supabase = await createAdminClient();
  const now = new Date().toISOString();
  const table = threadTable(actor);
  const idCol = threadIdColumn(actor);

  const { data: existing } = await supabase
    .from(table)
    .select("status")
    .eq(idCol, actor.id)
    .maybeSingle();

  if (!existing) {
    if (actor.type === "user") {
      await supabase.from("support_threads").insert({
        user_id: actor.id,
        status: "open",
        session_started_at: SESSION_EPOCH,
        updated_at: now,
      });
    } else {
      await supabase.from("support_guest_threads").insert({
        guest_id: actor.id,
        status: "open",
        session_started_at: SESSION_EPOCH,
        updated_at: now,
      });
    }
    return;
  }

  await supabase
    .from(table)
    .update({
      status: "open",
      closed_at: null,
      closed_by: null,
      updated_at: now,
    })
    .eq(idCol, actor.id);
}

export async function openThread(actor: SupportActor) {
  const supabase = await createAdminClient();
  const table = threadTable(actor);
  const idCol = threadIdColumn(actor);

  const { data: existing, error } = await supabase
    .from(table)
    .select("status, session_started_at")
    .eq(idCol, actor.id)
    .maybeSingle();

  if (error) return;

  const now = new Date().toISOString();
  const reopening = existing?.status === "closed";

  if (!existing) {
    if (actor.type === "user") {
      await supabase.from("support_threads").insert({
        user_id: actor.id,
        status: "open",
        session_started_at: SESSION_EPOCH,
        updated_at: now,
      });
    } else {
      await supabase.from("support_guest_threads").insert({
        guest_id: actor.id,
        status: "open",
        session_started_at: SESSION_EPOCH,
        updated_at: now,
      });
    }
    return;
  }

  if (!reopening) return;

  await supabase
    .from(table)
    .update({
      status: "open",
      closed_at: null,
      closed_by: null,
      session_started_at: now,
      updated_at: now,
    })
    .eq(idCol, actor.id);
}

export async function closeThread(actor: SupportActor, closedBy: "user" | "admin") {
  const supabase = await createAdminClient();
  const closedAt = new Date().toISOString();
  const table = threadTable(actor);
  const idCol = threadIdColumn(actor);

  const { data: existing } = await supabase
    .from(table)
    .select(idCol)
    .eq(idCol, actor.id)
    .maybeSingle();

  if (!existing) {
    if (actor.type === "user") {
      await supabase.from("support_threads").insert({
        user_id: actor.id,
        status: "closed",
        session_started_at: SESSION_EPOCH,
        closed_at: closedAt,
        closed_by: closedBy,
        updated_at: closedAt,
      });
    } else {
      await supabase.from("support_guest_threads").insert({
        guest_id: actor.id,
        status: "closed",
        session_started_at: SESSION_EPOCH,
        closed_at: closedAt,
        closed_by: closedBy,
        updated_at: closedAt,
      });
    }
    return;
  }

  await supabase
    .from(table)
    .update({
      status: "closed",
      closed_at: closedAt,
      closed_by: closedBy,
      updated_at: closedAt,
    })
    .eq(idCol, actor.id);
}

export async function linkTelegramMessage(telegramMessageId: number, actor: SupportActor) {
  const supabase = await createAdminClient();
  await supabase.from("support_tg_links").upsert({
    telegram_message_id: telegramMessageId,
    user_id: actor.type === "user" ? actor.id : null,
    guest_id: actor.type === "guest" ? actor.id : null,
  });
}

export async function getLastTelegramMessageId(actor: SupportActor): Promise<number | null> {
  const supabase = await createAdminClient();
  const idCol = messageIdColumn(actor);

  const { data: linked } = await supabase
    .from("support_tg_links")
    .select("telegram_message_id")
    .eq(idCol, actor.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linked?.telegram_message_id) {
    return linked.telegram_message_id;
  }

  const { data: msg } = await supabase
    .from("support_messages")
    .select("telegram_message_id")
    .eq(idCol, actor.id)
    .not("telegram_message_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return msg?.telegram_message_id ?? null;
}

export function isAdminTelegramChat(chatId?: number) {
  if (chatId == null) return false;
  try {
    const { chatId: adminChatId } = getTelegramConfig();
    return String(chatId) === String(adminChatId);
  } catch {
    return false;
  }
}

export async function resolveActorFromTelegramReply(
  replyToMessageId?: number,
  replyText?: string,
  messageText?: string,
): Promise<SupportActor | null> {
  const fromMessage = extractActorFromText(messageText);
  if (fromMessage) return fromMessage;

  const fromReply = extractActorFromText(replyText);
  if (fromReply) return fromReply;

  if (!replyToMessageId) return null;

  const supabase = await createAdminClient();

  const { data: link } = await supabase
    .from("support_tg_links")
    .select("user_id, guest_id")
    .eq("telegram_message_id", replyToMessageId)
    .maybeSingle();

  if (link?.user_id) {
    return { type: "user", id: link.user_id, name: "Користувач", email: "" };
  }
  if (link?.guest_id) {
    return { type: "guest", id: link.guest_id, name: "Гість" };
  }

  const { data: msg } = await supabase
    .from("support_messages")
    .select("user_id, guest_id")
    .eq("telegram_message_id", replyToMessageId)
    .maybeSingle();

  if (msg?.user_id) {
    return { type: "user", id: msg.user_id, name: "Користувач", email: "" };
  }
  if (msg?.guest_id) {
    return { type: "guest", id: msg.guest_id, name: "Гість" };
  }

  return null;
}

export async function resolveLatestSupportActor(): Promise<SupportActor | null> {
  const supabase = await createAdminClient();

  const { data: link } = await supabase
    .from("support_tg_links")
    .select("user_id, guest_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (link?.user_id) {
    return { type: "user", id: link.user_id, name: "Користувач", email: "" };
  }
  if (link?.guest_id) {
    return { type: "guest", id: link.guest_id, name: "Гість" };
  }

  const { data: msg } = await supabase
    .from("support_messages")
    .select("user_id, guest_id")
    .eq("direction", "user")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (msg?.user_id) {
    return { type: "user", id: msg.user_id, name: "Користувач", email: "" };
  }
  if (msg?.guest_id) {
    return { type: "guest", id: msg.guest_id, name: "Гість" };
  }

  return null;
}

export async function resolveSupportActorFromTelegramUpdate(params: {
  chatId?: number;
  replyToMessageId?: number;
  replyText?: string;
  messageText?: string;
}): Promise<SupportActor | null> {
  const fromReply = await resolveActorFromTelegramReply(
    params.replyToMessageId,
    params.replyText,
    params.messageText,
  );
  if (fromReply) return fromReply;

  if (!isAdminTelegramChat(params.chatId)) return null;

  return resolveLatestSupportActor();
}

export async function insertAdminSupportMessage(params: {
  actor: SupportActor;
  body: string;
  telegramMessageId: number;
}) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "service_role_missing" };
  }

  const supabase = await createAdminClient();

  const { error } =
    params.actor.type === "user"
      ? await supabase.from("support_messages").insert({
          user_id: params.actor.id,
          body: params.body,
          direction: "admin",
          telegram_message_id: params.telegramMessageId,
          read_at: null,
        })
      : await supabase.from("support_messages").insert({
          guest_id: params.actor.id,
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

export async function countUnreadAdminMessages(actor: SupportActor) {
  const supabase = await createAdminClient();
  const idCol = messageIdColumn(actor);

  const { count } = await supabase
    .from("support_messages")
    .select("id", { count: "exact", head: true })
    .eq(idCol, actor.id)
    .eq("direction", "admin")
    .is("read_at", null);

  return count ?? 0;
}

export async function fetchSupportMessages(actor: SupportActor, thread: SupportThreadInfo) {
  const supabase = await createAdminClient();
  const idCol = messageIdColumn(actor);

  let query = supabase
    .from("support_messages")
    .select("id, body, direction, created_at, read_at")
    .eq(idCol, actor.id)
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
      .eq(idCol, actor.id)
      .eq("direction", "admin")
      .is("read_at", null)
      .gte("created_at", since),
  ]);

  if (error) {
    return { messages: [], unreadCount: 0 };
  }

  const messages = (data ?? []).filter((m) => !m.body.startsWith("— Чат завершено"));
  return { messages, unreadCount: unreadCount ?? 0 };
}

export async function markSupportMessagesRead(actor: SupportActor) {
  const supabase = await createAdminClient();
  const idCol = messageIdColumn(actor);

  await supabase
    .from("support_messages")
    .update({ read_at: new Date().toISOString() })
    .eq(idCol, actor.id)
    .eq("direction", "admin")
    .is("read_at", null);
}

export async function insertUserSupportMessage(actor: SupportActor, body: string) {
  const supabase = await createAdminClient();

  if (actor.type === "user") {
    return supabase
      .from("support_messages")
      .insert({ user_id: actor.id, body, direction: "user" })
      .select("id")
      .single();
  }

  return supabase
    .from("support_messages")
    .insert({ guest_id: actor.id, body, direction: "user" })
    .select("id")
    .single();
}
