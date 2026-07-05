import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { markEnrollmentCompletedIfReady } from "@/lib/progress";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lesson_progress").upsert({
    user_id: profile.id,
    lesson_id: lessonId,
    completed: true,
    completed_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: lesson } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (lesson?.course_id) {
    const { data: courseLessons } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", lesson.course_id);

    const lessonIds = (courseLessons ?? []).map((row) => row.id as string);
    await markEnrollmentCompletedIfReady(supabase, profile.id, lesson.course_id, lessonIds);
  }

  return NextResponse.json({ ok: true });
}
