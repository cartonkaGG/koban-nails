import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  actorTag,
  attachGuestCookie,
  enrichActor,
  guestIdFromRequest,
  resolveSupportActor,
  saveGuestName,
  withGuestPayload,
} from "@/lib/support/actor";
import { notifySupportMessage } from "@/lib/telegram/send";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import {
  countUnreadAdminMessages,
  fetchSupportMessages,
  forceOpenThread,
  getThreadInfo,
  insertUserSupportMessage,
  linkTelegramMessage,
  openThread,
} from "@/lib/support/threads";

export async function GET(request: Request) {
  let actor = await resolveSupportActor(guestIdFromRequest(request));
  actor = await enrichActor(actor);

  if (!isSupabaseConfigured()) {
    const response = NextResponse.json(
      withGuestPayload(actor, {
        messages: [],
        unreadCount: 0,
        status: "open",
        mode: actor.type,
        displayName: actor.name,
      }),
    );
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  if (!isSupabaseAdminConfigured()) {
    console.error("GET /api/support: SUPABASE_SERVICE_ROLE_KEY missing or invalid");
    const response = NextResponse.json(
      withGuestPayload(actor, {
        messages: [],
        unreadCount: 0,
        status: "open",
        mode: actor.type,
        displayName: actor.name,
        error: "support_unavailable",
      }),
      { status: 503 },
    );
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  let thread = await getThreadInfo(actor);

  if (thread.available && thread.status === "open") {
    await forceOpenThread(actor);
    thread = await getThreadInfo(actor);
  }

  if (thread.available && thread.status === "closed") {
    const pending = await countUnreadAdminMessages(actor);
    if (pending > 0) {
      await forceOpenThread(actor);
      thread = await getThreadInfo(actor);
    } else {
      const response = NextResponse.json(
        withGuestPayload(actor, {
          messages: [],
          unreadCount: 0,
          status: "closed",
          mode: actor.type,
          displayName: actor.name,
        }),
      );
      if (actor.type === "guest") attachGuestCookie(response, actor.id);
      return response;
    }
  }

  const { messages, unreadCount } = await fetchSupportMessages(actor, thread);

  const response = NextResponse.json(
    withGuestPayload(actor, {
      messages,
      unreadCount,
      status: thread.status,
      mode: actor.type,
      displayName: actor.name,
    }),
  );
  if (actor.type === "guest") attachGuestCookie(response, actor.id);
  return response;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit({ key: `support:${ip}`, limit: 20, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const payload = await request.json();
  const text = typeof payload.body === "string" ? payload.body.trim() : "";
  const guestName = typeof payload.name === "string" ? payload.name.trim() : "";

  if (text.length < 1 || text.length > 2000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  let actor = await resolveSupportActor(guestIdFromRequest(request));
  if (actor.type === "guest" && guestName) {
    await saveGuestName(actor.id, guestName);
    actor = { ...actor, name: guestName };
  } else {
    actor = await enrichActor(actor);
  }

  if (!isSupabaseConfigured()) {
    await notifySupportMessage({
      actorTag: actorTag(actor),
      userName: actor.name,
      email: actor.type === "user" ? actor.email : undefined,
      isGuest: actor.type === "guest",
      body: text,
    });
    const response = NextResponse.json(withGuestPayload(actor, { ok: true, demo: true }));
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  const thread = await getThreadInfo(actor);
  if (thread.status === "closed" || !thread.available) {
    await openThread(actor);
  } else {
    await forceOpenThread(actor);
  }

  const { data: saved, error } = await insertUserSupportMessage(actor, text);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const telegram = await notifySupportMessage({
    actorTag: actorTag(actor),
    userName: actor.name,
    email: actor.type === "user" ? actor.email : undefined,
    isGuest: actor.type === "guest",
    body: text,
  });

  if (telegram.messageId) {
    await linkTelegramMessage(telegram.messageId, actor);
    if (saved?.id) {
      const supabase = await createAdminClient();
      const { error: tgUpdateError } = await supabase
        .from("support_messages")
        .update({ telegram_message_id: telegram.messageId })
        .eq("id", saved.id);
      if (tgUpdateError) {
        console.error("support POST: failed to store telegram_message_id", tgUpdateError.message, {
          messageId: saved.id,
          telegramMessageId: telegram.messageId,
        });
      }
    }
  }

  const response = NextResponse.json(
    withGuestPayload(actor, { ok: true, status: "open", mode: actor.type }),
  );
  if (actor.type === "guest") attachGuestCookie(response, actor.id);
  return response;
}
