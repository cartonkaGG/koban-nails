import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  attachGuestCookie,
  guestIdFromRequest,
  resolveSupportActor,
  withGuestPayload,
} from "@/lib/support/actor";
import {
  countUnreadAdminMessages,
  forceOpenThread,
  getThreadInfo,
} from "@/lib/support/threads";

export async function GET(request: Request) {
  let actor = await resolveSupportActor(guestIdFromRequest(request));

  if (!isSupabaseConfigured()) {
    const response = NextResponse.json(withGuestPayload(actor, { unreadCount: 0, mode: actor.type }));
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  if (!isSupabaseAdminConfigured()) {
    const response = NextResponse.json(
      withGuestPayload(actor, { unreadCount: 0, mode: actor.type, error: "support_unavailable" }),
      { status: 503 },
    );
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  let thread = await getThreadInfo(actor);

  if (thread.available && thread.status === "open") {
    await forceOpenThread(actor);
  }

  if (thread.available && thread.status === "closed") {
    const pending = await countUnreadAdminMessages(actor);
    const response = NextResponse.json(withGuestPayload(actor, { unreadCount: pending, mode: actor.type }));
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  const unreadCount = await countUnreadAdminMessages(actor);

  const response = NextResponse.json(
    withGuestPayload(actor, {
      unreadCount,
      mode: actor.type,
    }),
  );
  if (actor.type === "guest") attachGuestCookie(response, actor.id);
  return response;
}
