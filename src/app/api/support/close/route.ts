import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import {
  actorTag,
  attachGuestCookie,
  enrichActor,
  resolveSupportActor,
} from "@/lib/support/actor";
import {
  closeThread,
  getLastTelegramMessageId,
  getThreadStatus,
} from "@/lib/support/threads";
import { notifySupportChatClosed } from "@/lib/telegram/send";

export async function POST() {
  let actor = await resolveSupportActor();
  actor = await enrichActor(actor);

  if (!isSupabaseConfigured()) {
    const response = NextResponse.json({ ok: true, demo: true, status: "closed" });
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

  const response = NextResponse.json({ ok: true, status: "closed", messages: [] });
  if (actor.type === "guest") attachGuestCookie(response, actor.id);
  return response;
}

export async function GET() {
  const actor = await resolveSupportActor();
  const status = isSupabaseConfigured() ? await getThreadStatus(actor) : "open";
  const response = NextResponse.json({ status, mode: actor.type });
  if (actor.type === "guest") attachGuestCookie(response, actor.id);
  return response;
}
