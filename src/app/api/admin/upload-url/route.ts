import { NextResponse } from "next/server";
import { requireAdmin, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeUploadFileName } from "@/lib/video";

const BUCKET = "course-videos";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 400 });
  }

  const { lessonId, fileName, contentType } = await request.json();
  if (!lessonId || !fileName || !contentType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!contentType.startsWith("video/")) {
    return NextResponse.json({ error: "Only video files are allowed" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, course_id")
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const safeName = sanitizeUploadFileName(String(fileName));
  const path = `${lesson.course_id}/${lesson.id}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Upload URL failed" }, { status: 400 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path: `storage:${path}`,
    token: data.token,
  });
}
