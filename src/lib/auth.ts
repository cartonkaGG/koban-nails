import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_ADMIN, DEMO_PROFILE } from "@/lib/demo-data";
import { isDemoAuthAllowed } from "@/lib/security/demo-auth";
import type { Profile } from "@/lib/types";

export { isSupabaseConfigured };

type AuthUser = {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: {
    full_name?: string;
  };
};

function makeProfileFromUser(user: AuthUser): Profile | null {
  if (!user.email) return null;

  const email = user.email.toLowerCase();
  return {
    id: user.id,
    email,
    full_name: user.user_metadata?.full_name ?? email.split("@")[0],
    phone: null,
    role: isAdminEmail(email) ? "admin" : "student",
    avatar_url: null,
    created_at: user.created_at ?? new Date().toISOString(),
  };
}

export async function resolveProfileForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: AuthUser,
): Promise<Profile | null> {
  const fallbackProfile = makeProfileFromUser(user);
  if (!fallbackProfile) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error?.message.includes("public.profiles")) {
    return fallbackProfile;
  }

  if (error && !data) {
    const isMissingRow =
      error.code === "PGRST116" || error.message.toLowerCase().includes("0 rows");
    if (!isMissingRow) {
      console.error("resolveProfileForUser:", error);
      return fallbackProfile;
    }
  }

  if (!data) {
    if (!isSupabaseAdminConfigured() || !user.email) return fallbackProfile;

    const adminSupabase = await createAdminClient();
    const role = isAdminEmail(user.email) ? "admin" : "student";
    const { data: createdProfile, error: createProfileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.email.split("@")[0],
        role,
      })
      .select("*")
      .single();

    if (createProfileError?.message.includes("public.profiles")) return fallbackProfile;
    if (!createdProfile) return fallbackProfile;

    return createdProfile as Profile;
  }

  const profile = data as Profile;
  return isAdminEmail(profile.email) ? { ...profile, role: "admin" } : profile;
}

export async function getSessionUser() {
  if (!isSupabaseConfigured()) {
    if (!isDemoAuthAllowed()) return null;
    const store = await cookies();
    const demo = store.get("koban_demo_user")?.value;
    if (demo === "admin") return { id: DEMO_ADMIN.id, email: DEMO_ADMIN.email };
    if (demo === "student") return { id: DEMO_PROFILE.id, email: DEMO_PROFILE.email };
    return null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    if (!isDemoAuthAllowed()) return null;
    const store = await cookies();
    const demo = store.get("koban_demo_user")?.value;
    if (demo === "admin") return DEMO_ADMIN;
    if (demo === "student") return DEMO_PROFILE;
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return resolveProfileForUser(supabase, user);
  } catch (error) {
    console.error("getProfile:", error);
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return makeProfileFromUser(user);
    } catch {
      // ignore secondary failure
    }
    return null;
  }
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) {
    throw new Error("UNAUTHORIZED");
  }
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return profile;
}
