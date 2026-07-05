import { NextResponse } from "next/server";
import { requireAdmin, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { activateEnrollment } from "@/lib/enrollments";

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId, status } = await request.json();
  if (!enrollmentId || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("enrollments")
    .update({
      status,
      purchased_at: status === "active" ? new Date().toISOString() : null,
    })
    .eq("id", enrollmentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, courseId, status = "active" } = await request.json();
  if (!userId || !courseId) {
    return NextResponse.json({ error: "Missing userId or courseId" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const { error } = await activateEnrollment(userId, courseId);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (status !== "active") {
    const supabase = await createAdminClient();
    await supabase.from("enrollments").update({ status }).eq("user_id", userId).eq("course_id", courseId);
  }

  return NextResponse.json({ ok: true });
}
