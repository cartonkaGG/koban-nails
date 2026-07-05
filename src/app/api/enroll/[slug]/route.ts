import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { addDemoEnrollment } from "@/lib/demo-enrollments";
import { sendEmail } from "@/lib/emails/send";
import { renderPurchaseThankYouEmail } from "@/lib/emails/templates";
import { activateEnrollment } from "@/lib/enrollments";
import { getCourseBySlug, getEnrollment } from "@/lib/data";
import { getSiteOrigin } from "@/lib/site-url";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (course.payment_url) {
    return NextResponse.json({ ok: true, redirect: course.payment_url });
  }

  if (!isSupabaseConfigured()) {
    await addDemoEnrollment(slug);
    return NextResponse.json({
      ok: true,
      demo: true,
      redirect: "/cabinet",
    });
  }

  const existing = await getEnrollment(profile.id, course.id);
  const isNewPurchase = !existing || existing.status !== "active";

  const { error } = await activateEnrollment(profile.id, course.id);
  if (error) {
    return NextResponse.json({ error: "Не вдалося активувати курс" }, { status: 500 });
  }

  if (isNewPurchase) {
    const origin = getSiteOrigin(request);
    const firstName = profile.full_name?.split(" ")[0] ?? "Друже";
    const template = renderPurchaseThankYouEmail({
      firstName,
      courseTitle: course.title,
      cabinetUrl: `${origin}/cabinet`,
    });

    await sendEmail({
      to: profile.email,
      subject: template.subject,
      html: template.html,
    });
  }

  return NextResponse.json({
    ok: true,
    redirect: "/cabinet",
  });
}
