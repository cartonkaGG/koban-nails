import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoragePath, isStorageVideo } from "@/lib/video";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "course-videos";
const SIGNED_TTL = 60 * 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ url: null, demo: true });
  }

  const supabase = await createClient();
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, video_url, course_id")
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson?.video_url) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", profile.id)
    .eq("course_id", lesson.course_id)
    .in("status", ["active", "completed"])
    .maybeSingle();

  const isAdmin = profile.role === "admin";
  if (!isAdmin && !enrollment) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isStorageVideo(lesson.video_url)) {
    return NextResponse.json({ url: lesson.video_url, type: "direct" });
  }

  const admin = await createAdminClient();
  const path = getStoragePath(lesson.video_url);
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "Signed URL failed" }, { status: 400 });
  }

  return NextResponse.json({ url: data.signedUrl, type: "signed" });
}
