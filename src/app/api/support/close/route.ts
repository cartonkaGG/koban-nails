import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import {
  actorTag,
  attachGuestCookie,
  enrichActor,
  guestIdFromRequest,
  resolveSupportActor,
  withGuestPayload,
} from "@/lib/support/actor";
import {
  closeThread,
  getLastTelegramMessageId,
  getThreadStatus,
} from "@/lib/support/threads";
import { notifySupportChatClosed } from "@/lib/telegram/send";

export async function POST(request: Request) {
  let actor = await resolveSupportActor(guestIdFromRequest(request));
  actor = await enrichActor(actor);

  if (!isSupabaseConfigured()) {
    const response = NextResponse.json(
      withGuestPayload(actor, { ok: true, demo: true, status: "closed" }),
    );
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  await closeThread(actor, "user");

  const replyToMessageId = await getLastTelegramMessageId(actor);
  await notifySupportChatClosed({
    actorTag: actorTag(actor),
    userName: actor.name,
    email: actor.type === "user" ? actor.email : undefined,
    isGuest: actor.type === "guest",
    closedBy: "user",
    replyToMessageId,
  });

  const response = NextResponse.json(
    withGuestPayload(actor, { ok: true, status: "closed", messages: [] }),
  );
  if (actor.type === "guest") attachGuestCookie(response, actor.id);
  return response;
}

export async function GET(request: Request) {
  const actor = await resolveSupportActor(guestIdFromRequest(request));
  const status = isSupabaseConfigured() ? await getThreadStatus(actor) : "open";
  const response = NextResponse.json(withGuestPayload(actor, { status, mode: actor.type }));
  if (actor.type === "guest") attachGuestCookie(response, actor.id);
  return response;
}
