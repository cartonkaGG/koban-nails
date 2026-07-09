import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth";
import {
  attachGuestCookie,
  enrichActor,
  guestIdFromRequest,
  resolveSupportActor,
  withGuestPayload,
} from "@/lib/support/actor";
import {
  countUnreadAdminMessages,
  getThreadInfo,
  shouldFilterBySession,
} from "@/lib/support/threads";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  let actor = await resolveSupportActor(guestIdFromRequest(request));

  if (!isSupabaseConfigured()) {
    const response = NextResponse.json(withGuestPayload(actor, { unreadCount: 0, mode: actor.type }));
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  const thread = await getThreadInfo(actor);

  if (thread.available && thread.status === "closed") {
    const pending = await countUnreadAdminMessages(actor);
    const response = NextResponse.json(withGuestPayload(actor, { unreadCount: pending, mode: actor.type }));
    if (actor.type === "guest") attachGuestCookie(response, actor.id);
    return response;
  }

  const supabase = await createAdminClient();
  const idCol = actor.type === "user" ? "user_id" : "guest_id";

  let query = supabase
    .from("support_messages")
    .select("id", { count: "exact", head: true })
    .eq(idCol, actor.id)
    .eq("direction", "admin")
    .is("read_at", null);

  if (thread.available && shouldFilterBySession(thread.sessionStartedAt) && thread.sessionStartedAt) {
    query = query.gte("created_at", thread.sessionStartedAt);
  }

  const { count, error } = await query;

  const response = NextResponse.json(
    withGuestPayload(actor, {
      unreadCount: error ? 0 : (count ?? 0),
      mode: actor.type,
    }),
  );
  if (actor.type === "guest") attachGuestCookie(response, actor.id);
  return response;
}
