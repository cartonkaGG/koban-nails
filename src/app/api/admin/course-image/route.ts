import { NextResponse } from "next/server";
import { requireAdmin, isSupabaseConfigured } from "@/lib/auth";
import { humanizeAdminDbError } from "@/lib/courses-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv, isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { sanitizeUploadFileName } from "@/lib/video";

const BUCKET = "course-images";
const MAX_BYTES = 10 * 1024 * 1024;

function adminNotConfiguredResponse() {
  return NextResponse.json(
    {
      error:
        "SUPABASE_SERVICE_ROLE_KEY не налаштований на сервері. Додайте ключ у Vercel → Settings → Environment Variables.",
    },
    { status: 503 },
  );
}

function buildPublicUrl(path: string) {
  const { url: supabaseUrl } = getSupabaseEnv();
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
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

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    const courseId = String(formData.get("courseId") ?? "").trim();

    if (!(file instanceof File) || !courseId) {
      return NextResponse.json({ error: "Потрібні file та courseId" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Файл занадто великий (макс. 10 МБ)" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const safeName = sanitizeUploadFileName(file.name);
    const path = `${course.id}/cover-${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

    if (uploadError) {
      return NextResponse.json(
        { error: humanizeAdminDbError(uploadError.message) },
        { status: 400 },
      );
    }

    const storagePath = `storage:${path}`;
    return NextResponse.json({
      storagePath,
      publicUrl: buildPublicUrl(path),
    });
  }

  const { courseId, fileName, contentType: mimeType } = await request.json();
  if (!courseId || !fileName || !mimeType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!mimeType.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const safeName = sanitizeUploadFileName(String(fileName));
  const path = `${course.id}/cover-${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: humanizeAdminDbError(error?.message ?? "Upload URL failed") },
      { status: 400 },
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    publicUrl: buildPublicUrl(path),
    storagePath: `storage:${path}`,
    token: data.token,
  });
}
