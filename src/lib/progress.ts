import type { SupabaseClient } from "@supabase/supabase-js";

export async function getCompletedLessonIds(
  supabase: SupabaseClient,
  userId: string,
  lessonIds: string[],
) {
  if (lessonIds.length === 0) return [] as string[];

  const { data } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("completed", true)
    .in("lesson_id", lessonIds);

  return (data ?? []).map((row) => row.lesson_id as string);
}

export function isCourseFullyCompleted(lessonIds: string[], completedIds: string[]) {
  if (lessonIds.length === 0) return false;
  const done = new Set(completedIds);
  return lessonIds.every((id) => done.has(id));
}

export async function getCourseCompletionDate(
  supabase: SupabaseClient,
  userId: string,
  lessonIds: string[],
) {
  if (lessonIds.length === 0) return null;

  const { data } = await supabase
    .from("lesson_progress")
    .select("completed_at")
    .eq("user_id", userId)
    .eq("completed", true)
    .in("lesson_id", lessonIds);

  const timestamps = (data ?? [])
    .map((row) => row.completed_at)
    .filter((value): value is string => typeof value === "string");

  if (timestamps.length === 0) return null;

  return timestamps.reduce((latest, value) =>
    new Date(value).getTime() > new Date(latest).getTime() ? value : latest,
  );
}

export async function markEnrollmentCompletedIfReady(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  lessonIds: string[],
) {
  const completedIds = await getCompletedLessonIds(supabase, userId, lessonIds);
  if (!isCourseFullyCompleted(lessonIds, completedIds)) return false;

  const completedAt = await getCourseCompletionDate(supabase, userId, lessonIds);

  const { error } = await supabase
    .from("enrollments")
    .update({
      status: "completed",
      ...(completedAt ? { completed_at: completedAt } : {}),
    })
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .in("status", ["active", "completed"]);

  return !error;
}
