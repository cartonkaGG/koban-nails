import { NextResponse } from "next/server";
import { requireAdmin, isSupabaseConfigured } from "@/lib/auth";
import { buildCourseUpdatePayload, humanizeAdminDbError } from "@/lib/courses-admin";
import { revalidateCoursesCatalog } from "@/lib/revalidate-courses";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { removeCourseStorage } from "@/lib/course-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ enrollmentCount: 0, archived: false });
  }

  const supabase = await createAdminClient();
  const [{ data: course }, { count }] = await Promise.all([
    supabase.from("courses").select("id, archived_at").eq("id", id).maybeSingle(),
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("course_id", id),
  ]);

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({
    enrollmentCount: count ?? 0,
    archived: Boolean(course.archived_at),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY не налаштований на сервері. Додайте ключ у Vercel → Settings → Environment Variables.",
      },
      { status: 503 },
    );
  }

  const supabase = await createAdminClient();
  const payload = buildCourseUpdatePayload(body);
  const { error } = await supabase.from("courses").update(payload).eq("id", id);

  if (error) {
    return NextResponse.json({ error: humanizeAdminDbError(error.message) }, { status: 400 });
  }
  revalidateCoursesCatalog();
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { action?: string; confirmSlug?: string };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createAdminClient();

  if (body.action === "restore") {
    const { error } = await supabase
      .from("courses")
      .update({ archived_at: null })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    revalidateCoursesCatalog();
    return NextResponse.json({ ok: true, restored: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

/** Soft-archive: hides course from storefront, keeps enrollments and files. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: { confirmSlug?: string; purge?: boolean } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Потрібне підтвердження slug курсу" }, { status: 400 });
  }

  if (!body.confirmSlug?.trim()) {
    return NextResponse.json({ error: "Введіть slug курсу для підтвердження" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createAdminClient();
  const { data: course, error: fetchError } = await supabase
    .from("courses")
    .select("id, title, slug, archived_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (body.confirmSlug.trim().toLowerCase() !== course.slug.toLowerCase()) {
    return NextResponse.json({ error: "Slug не збігається — перевірте написання" }, { status: 400 });
  }

  if (body.purge) {
    const { count, error: countError } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 });
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Неможливо видалити назавжди: є ${count} записів про покупку. Архівуйте курс замість цього.`,
          enrollmentCount: count,
        },
        { status: 409 },
      );
    }

    await removeCourseStorage(supabase, id);
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    revalidateCoursesCatalog();
    return NextResponse.json({ ok: true, purged: true, title: course.title });
  }

  if (course.archived_at) {
    return NextResponse.json({ ok: true, archived: true, alreadyArchived: true });
  }

  const { error } = await supabase
    .from("courses")
    .update({
      archived_at: new Date().toISOString(),
      published: false,
      featured: false,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidateCoursesCatalog();
  return NextResponse.json({ ok: true, archived: true, title: course.title });
}
