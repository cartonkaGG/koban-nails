import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { sendEmail } from "@/lib/emails/send";
import { renderPurchaseThankYouEmail } from "@/lib/emails/templates";
import { getCourseBySlug } from "@/lib/data";
import { getSiteOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

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

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true, redirect: `/cabinet/courses/${slug}` });
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("user_id", profile.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (course.payment_url) {
    return NextResponse.json({ ok: true, redirect: course.payment_url });
  }

  const isNewPurchase = !existing;

  if (!existing) {
    await supabase.from("enrollments").insert({
      user_id: profile.id,
      course_id: course.id,
      status: "active",
      purchased_at: new Date().toISOString(),
    });
  } else if (existing.status !== "active") {
    await supabase
      .from("enrollments")
      .update({
        status: "active",
        purchased_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  }

  if (isNewPurchase || existing?.status !== "active") {
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
    redirect: `/cabinet/courses/${slug}`,
  });
}
