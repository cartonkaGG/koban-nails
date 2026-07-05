import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { addDemoEnrollment } from "@/lib/demo-enrollments";
import { sendEmail } from "@/lib/emails/send";
import { renderPurchaseThankYouEmail } from "@/lib/emails/templates";
import { activateEnrollment } from "@/lib/enrollments";
import { getCourseBySlug, getEnrollment } from "@/lib/data";
import { getSiteOrigin } from "@/lib/site-url";
import { notifyPurchase } from "@/lib/telegram/send";

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
    await notifyPurchase({
      userName: profile.full_name ?? profile.email,
      email: profile.email,
      courseTitle: course.title,
      priceUah: course.price_uah,
    });
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

    await notifyPurchase({
      userName: profile.full_name ?? profile.email,
      email: profile.email,
      courseTitle: course.title,
      priceUah: course.price_uah,
    });
  }

  return NextResponse.json({
    ok: true,
    redirect: "/cabinet",
  });
}
