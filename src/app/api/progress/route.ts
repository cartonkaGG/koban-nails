import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { markEnrollmentCompletedIfReady } from "@/lib/progress";
import { isDemoAuthAllowed } from "@/lib/security/demo-auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await request.json();

  if (typeof lessonId !== "string" || !UUID_RE.test(lessonId)) {
    return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    if (!isDemoAuthAllowed()) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson?.course_id) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  if (profile.role !== "admin") {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("status")
      .eq("user_id", profile.id)
      .eq("course_id", lesson.course_id)
      .maybeSingle();

    if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabase.from("lesson_progress").upsert({
    user_id: profile.id,
    lesson_id: lessonId,
    completed: true,
    completed_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: courseLessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", lesson.course_id);

  const lessonIds = (courseLessons ?? []).map((row) => row.id as string);
  await markEnrollmentCompletedIfReady(supabase, profile.id, lesson.course_id, lessonIds);

  return NextResponse.json({ ok: true });
}
