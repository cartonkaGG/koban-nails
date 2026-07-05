import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { certificateFileName, generateCourseCertificatePdf } from "@/lib/certificate";
import { getCourseBySlug, getEnrollment, getLessonsForCourse } from "@/lib/data";
import {
  getCompletedLessonIds,
  getCourseCompletionDate,
  isCourseFullyCompleted,
} from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Certificates require Supabase" }, { status: 400 });
  }

  const course = await getCourseBySlug(slug);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (!course.certificate_template_url) {
    return NextResponse.json({ error: "Certificate template is not configured for this course" }, { status: 404 });
  }

  const enrollment = await getEnrollment(profile.id, course.id);
  if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
    return NextResponse.json({ error: "No active enrollment" }, { status: 403 });
  }

  const fullName = profile.full_name?.trim();
  if (!fullName) {
    return NextResponse.json(
      { error: "Вкажіть ім'я та прізвище в профілі перед генерацією сертифіката" },
      { status: 400 },
    );
  }

  const lessons = await getLessonsForCourse(course.id);
  const lessonIds = lessons.map((lesson) => lesson.id);

  if (lessonIds.length === 0) {
    return NextResponse.json({ error: "Course has no lessons" }, { status: 400 });
  }

  const supabase = await createClient();
  const completedIds = await getCompletedLessonIds(supabase, profile.id, lessonIds);

  if (!isCourseFullyCompleted(lessonIds, completedIds)) {
    return NextResponse.json(
      { error: "Сертифікат доступний лише після проходження всіх уроків" },
      { status: 403 },
    );
  }

  const completedAt =
    (await getCourseCompletionDate(supabase, profile.id, lessonIds)) ?? new Date().toISOString();

  try {
    const pdfBytes = await generateCourseCertificatePdf({
      templateUrl: course.certificate_template_url,
      fullName,
      completedAt,
    });

    const fileName = certificateFileName(course.slug, fullName);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("certificate generate:", error);
    return NextResponse.json({ error: "Не вдалося згенерувати сертифікат" }, { status: 500 });
  }
}
