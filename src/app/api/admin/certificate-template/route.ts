import { NextResponse } from "next/server";
import { requireAdmin, isSupabaseConfigured } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { sanitizeUploadFileName } from "@/lib/video";

const BUCKET = "course-images";
const MAX_BYTES = 15 * 1024 * 1024;

function adminNotConfiguredResponse() {
  return NextResponse.json(
    {
      error:
        "SUPABASE_SERVICE_ROLE_KEY не налаштований на сервері. Додайте ключ у Vercel → Settings → Environment Variables.",
    },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return adminNotConfiguredResponse();
  }

  const { courseId, fileName, contentType, fileSize } = (await request.json()) as {
    courseId?: string;
    fileName?: string;
    contentType?: string;
    fileSize?: number;
  };

  if (!courseId?.trim() || !fileName?.trim() || !contentType || typeof fileSize !== "number") {
    return NextResponse.json({ error: "Потрібні courseId та дані файлу" }, { status: 400 });
  }

  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Дозволені лише зображення (PNG, JPG, WebP)" }, { status: 400 });
  }

  if (fileSize <= 0 || fileSize > MAX_BYTES) {
    return NextResponse.json({ error: "Файл занадто великий (макс. 15 МБ)" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId.trim())
    .single();

  if (courseError || !course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const safeName = sanitizeUploadFileName(fileName);
  const storagePath = `${course.id}/certificate-${Date.now()}-${safeName}`;
  const { data, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (uploadError || !data) {
    return NextResponse.json({ error: uploadError?.message ?? "Не вдалося підготувати завантаження" }, { status: 400 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    storagePath: `storage:${storagePath}`,
    token: data.token,
  });
}
