import { NextResponse } from "next/server";
import { requireAdmin, isSupabaseConfigured } from "@/lib/auth";
import { buildCourseUpdatePayload, humanizeAdminDbError } from "@/lib/courses-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ id: "demo-new", ...body });
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
  const payload = buildCourseUpdatePayload({
    ...body,
    title: body.title ?? "Новий курс",
    slug: body.slug ?? `course-${Date.now()}`,
    published: false,
  });

  const { data, error } = await supabase
    .from("courses")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: humanizeAdminDbError(error.message) }, { status: 400 });
  }
  return NextResponse.json(data);
}
