import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import { attachGuestCookie, resolveSupportActor } from "@/lib/support/actor";
import { markSupportMessagesRead } from "@/lib/support/threads";

export async function POST() {
  const actor = await resolveSupportActor();

  if (!isSupabaseConfigured()) {
    const response = NextResponse.json({ ok: true });
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  await markSupportMessagesRead(actor);

  const response = NextResponse.json({ ok: true });
  if (actor.type === "guest") attachGuestCookie(response, actor.id);
  return response;
}
