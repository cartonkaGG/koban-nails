import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEMO_ADMIN, DEMO_PROFILE } from "@/lib/demo-data";
import type { Profile } from "@/lib/types";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getSessionUser() {
  if (!isSupabaseConfigured()) {
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
    const store = await cookies();
    const demo = store.get("koban_demo_user")?.value;
    if (demo === "admin") return DEMO_ADMIN;
    if (demo === "student") return DEMO_PROFILE;
    return null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
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
