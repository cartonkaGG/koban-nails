import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { addDemoEnrollment } from "@/lib/demo-enrollments";
import { requestPendingEnrollment } from "@/lib/enrollments";
import { getCourseBySlug, getEnrollment } from "@/lib/data";
import { getEffectiveCoursePrice } from "@/lib/types";
import { notifyPurchaseRequest } from "@/lib/telegram/send";
import { isLiqPayConfigured, getLiqPayPrivateKey } from "@/lib/liqpay/config";
import { buildLiqPayCheckout } from "@/lib/liqpay/checkout";
import { createCoursePayment } from "@/lib/payments";

export async function POST(
  _request: Request,
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

  if (course.archived_at) {
    return NextResponse.json({ error: "Курс більше не доступний для покупки" }, { status: 410 });
  }

  const payPrice = getEffectiveCoursePrice(course);
  if (payPrice <= 0) {
    return NextResponse.json({ error: "Курс недоступний для оплати" }, { status: 400 });
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

  if (existing?.status === "active" || existing?.status === "completed") {
    return NextResponse.json({ ok: true, redirect: "/cabinet" });
  }

  if (isLiqPayConfigured()) {
    const { payment, error: paymentError } = await createCoursePayment({
      userId: profile.id,
      courseId: course.id,
      amountUah: payPrice,
    });

    if (!payment || paymentError) {
      return NextResponse.json(
        { error: paymentError ?? "Не вдалося створити платіж" },
        { status: 500 },
      );
    }

    await requestPendingEnrollment(profile.id, course.id);

    const checkout = buildLiqPayCheckout({
      orderId: payment.order_id,
      amountUah: payPrice,
      description: `Курс «${course.title}» — Koban nails`,
      privateKey: getLiqPayPrivateKey(),
    });

    return NextResponse.json({
      ok: true,
      liqpay: checkout,
    });
  }

  if (course.payment_url) {
    return NextResponse.json({ ok: true, redirect: course.payment_url });
  }

  if (existing?.status === "pending") {
    return NextResponse.json({
      ok: true,
      pending: true,
      message: "Заявка вже надіслана. Очікуйте підтвердження оплати.",
      redirect: "/cabinet",
    });
  }

  const { error } = await requestPendingEnrollment(profile.id, course.id);
  if (error) {
    return NextResponse.json({ error: "Не вдалося створити заявку" }, { status: 500 });
  }

  await notifyPurchaseRequest({
    userName: profile.full_name ?? profile.email,
    email: profile.email,
    courseTitle: course.title,
    priceUah: payPrice,
  });

  return NextResponse.json({
    ok: true,
    pending: true,
    message:
      "Заявку надіслано. Після перевірки оплати адміністратор відкриє курс у вашому кабінеті.",
    redirect: "/cabinet",
  });
}
