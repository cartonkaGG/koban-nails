import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ loggedIn: false, unreadCount: 0 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ loggedIn: true, unreadCount: 0 });
  }

  const supabase = await createAdminClient();
  const { count, error } = await supabase
    .from("support_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("direction", "admin")
    .is("read_at", null);

  if (error) {
    return NextResponse.json({ loggedIn: true, unreadCount: 0 });
  }

  return NextResponse.json({
    loggedIn: true,
    unreadCount: count ?? 0,
  });
}
