import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyAuthCookieDefaults } from "@/lib/supabase/cookies";

export const SUPPORT_GUEST_COOKIE = "support_guest_id";
export const SUPPORT_GUEST_ID_HEADER = "x-support-guest-id";

export type SupportActor =
  | { type: "user"; id: string; name: string; email: string }
  | { type: "guest"; id: string; name: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidSupportId(value: string) {
  return UUID_RE.test(value);
}

export function actorTag(actor: SupportActor) {
  return actor.type === "user" ? `#user:${actor.id}` : `#guest:${actor.id}`;
}

export function extractActorFromText(text?: string | null): SupportActor | null {
  if (!text) return null;

  const guest = text.match(/#guest:([0-9a-f-]{36})/i);
  if (guest?.[1]) {
    return { type: "guest", id: guest[1], name: "Гість" };
  }

  const user = text.match(/#user:([0-9a-f-]{36})/i);
  if (user?.[1]) {
    return { type: "user", id: user[1], name: "Користувач", email: "" };
  }

  return null;
}

/** Remove #user:/#guest: tags copied into an admin reply before showing in the widget. */
export function stripActorTagsFromText(text: string) {
  return text.replace(/#(?:guest|user):[0-9a-f-]{36}\s*/gi, "").trim();
}

export async function readGuestIdFromCookie() {
  const store = await cookies();
  const value = store.get(SUPPORT_GUEST_COOKIE)?.value;
  return value && isValidSupportId(value) ? value : null;
}

export function createGuestId() {
  return randomUUID();
}

export function attachGuestCookie(response: NextResponse, guestId: string) {
  response.cookies.set(
    SUPPORT_GUEST_COOKIE,
    guestId,
    applyAuthCookieDefaults({ httpOnly: true }),
  );
  return response;
}

export async function resolveSupportActor(guestIdFromRequest?: string | null): Promise<SupportActor> {
  const profile = await getProfile();
  if (profile) {
    return {
      type: "user",
      id: profile.id,
      name: profile.full_name ?? profile.email,
      email: profile.email,
    };
  }

  // Widget sends x-support-guest-id from localStorage; prefer it over a stale cookie.
  const guestFromHeader =
    guestIdFromRequest && isValidSupportId(guestIdFromRequest) ? guestIdFromRequest : null;
  const guestFromCookie = await readGuestIdFromCookie();
  let guestId = guestFromHeader ?? guestFromCookie;
  if (!guestId || !isValidSupportId(guestId)) {
    guestId = createGuestId();
  }

  const name = await getGuestName(guestId);
  return { type: "guest", id: guestId, name: name ?? "Гість" };
}

export async function getGuestName(guestId: string) {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("support_guest_threads")
    .select("guest_name")
    .eq("guest_id", guestId)
    .maybeSingle();

  return data?.guest_name?.trim() || null;
}

export function guestIdFromRequest(request: Request) {
  const value = request.headers.get(SUPPORT_GUEST_ID_HEADER);
  return value && isValidSupportId(value) ? value : null;
}

export function withGuestPayload<T extends Record<string, unknown>>(actor: SupportActor, payload: T) {
  if (actor.type !== "guest") return payload;
  return { ...payload, guestId: actor.id };
}

export async function saveGuestName(guestId: string, name: string) {
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return;

  const supabase = await createAdminClient();
  const now = new Date().toISOString();
  const sessionEpoch = "1970-01-01T00:00:00.000Z";

  const { data: existing } = await supabase
    .from("support_guest_threads")
    .select("guest_id")
    .eq("guest_id", guestId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("support_guest_threads")
      .update({ guest_name: trimmed, updated_at: now })
      .eq("guest_id", guestId);
    return;
  }

  await supabase.from("support_guest_threads").insert({
    guest_id: guestId,
    guest_name: trimmed,
    status: "open",
    session_started_at: sessionEpoch,
    updated_at: now,
  });
}

export async function enrichActor(actor: SupportActor): Promise<SupportActor> {
  if (actor.type === "user") return actor;
  const name = await getGuestName(actor.id);
  return { ...actor, name: name ?? actor.name };
}
