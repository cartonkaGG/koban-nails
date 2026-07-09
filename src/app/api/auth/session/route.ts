import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getProfile, resolveProfileForUser } from "@/lib/auth";
import { applyAuthCookieDefaults } from "@/lib/supabase/cookies";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "@/lib/types";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

function applyQueuedCookies(response: NextResponse, cookiesToSet: CookieToSet[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, applyAuthCookieDefaults(options));
  });
}

function sessionPayload(profile: Profile) {
  return {
    loggedIn: true as const,
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
    },
  };
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ loggedIn: false });
    }
    return NextResponse.json(sessionPayload(profile));
  }

  const queuedCookies: CookieToSet[] = [];
  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        queuedCookies.push(...cookiesToSet);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await resolveProfileForUser(supabase, user) : null;
  const response = NextResponse.json(
    profile ? sessionPayload(profile) : { loggedIn: false },
  );

  applyQueuedCookies(response, queuedCookies);
  return response;
}
