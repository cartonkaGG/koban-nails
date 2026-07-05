import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { countUnreadAdminMessages, getThreadInfo, shouldFilterBySession } from "@/lib/support/threads";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ loggedIn: false, unreadCount: 0 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ loggedIn: true, unreadCount: 0 });
  }

  const thread = await getThreadInfo(profile.id);
  if (thread.available && thread.status === "closed") {
    const pending = await countUnreadAdminMessages(profile.id);
    return NextResponse.json({ loggedIn: true, unreadCount: pending });
  }

  const supabase = await createAdminClient();
  let query = supabase
    .from("support_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("direction", "admin")
    .is("read_at", null);

  if (thread.available && shouldFilterBySession(thread.sessionStartedAt) && thread.sessionStartedAt) {
    query = query.gte("created_at", thread.sessionStartedAt);
  }

  const { count, error } = await query;

  if (error) {
    return NextResponse.json({ loggedIn: true, unreadCount: 0 });
  }

  return NextResponse.json({
    loggedIn: true,
    unreadCount: count ?? 0,
  });
}
