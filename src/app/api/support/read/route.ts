import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import { attachGuestCookie, guestIdFromRequest, resolveSupportActor, withGuestPayload } from "@/lib/support/actor";
import { markSupportMessagesRead } from "@/lib/support/threads";

export async function POST(request: Request) {
  const actor = await resolveSupportActor(guestIdFromRequest(request));

  if (!isSupabaseConfigured()) {
    const response = NextResponse.json(withGuestPayload(actor, { ok: true }));
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  await markSupportMessagesRead(actor);

  const response = NextResponse.json(withGuestPayload(actor, { ok: true }));
  if (actor.type === "guest") attachGuestCookie(response, actor.id);
  return response;
}
