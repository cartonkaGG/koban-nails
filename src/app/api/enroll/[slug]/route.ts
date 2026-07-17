import { NextResponse } from "next/server";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { isDemoAuthAllowed } from "@/lib/security/demo-auth";
import { validatePaymentUrl } from "@/lib/security/payment-url";
import { addDemoEnrollment } from "@/lib/demo-enrollments";
import { requestPendingEnrollment } from "@/lib/enrollments";
import { getCourseBySlug, getEnrollment } from "@/lib/data";
import { getEffectiveCoursePrice } from "@/lib/types";
import { notifyPurchaseRequest } from "@/lib/telegram/send";
import { isLiqPayConfigured, getLiqPayPrivateKey } from "@/lib/liqpay/config";
import { buildLiqPayCheckout } from "@/lib/liqpay/checkout";
import { createCoursePayment } from "@/lib/payments";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { acceptTerms?: unknown } | null;
  if (body?.acceptTerms !== true) {
    return NextResponse.json(
      { error: "Потрібно погодитись з публічною офертою та політиками сайту." },
      { status: 400 },
    );
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
    if (!isDemoAuthAllowed()) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
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
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        {
          error:
            "Оплата не налаштована на сервері. Додайте SUPABASE_SERVICE_ROLE_KEY у Vercel.",
        },
        { status: 503 },
      );
    }

    const { payment, error: paymentError } = await createCoursePayment({
      userId: profile.id,
      courseId: course.id,
      amountUah: payPrice,
    });

    if (!payment || paymentError) {
      console.error("createCoursePayment:", paymentError);
      return NextResponse.json(
        {
          error:
            paymentError?.includes("payments")
              ? "Таблиця payments відсутня. Запустіть міграцію 20260706_liqpay_payments.sql у Supabase."
              : (paymentError ?? "Не вдалося створити платіж"),
        },
        { status: 500 },
      );
    }

    const { error: enrollError } = await requestPendingEnrollment(profile.id, course.id);
    if (enrollError) {
      console.error("requestPendingEnrollment (liqpay):", enrollError);
      return NextResponse.json(
        { error: enrollError || "Не вдалося створити заявку на оплату" },
        { status: 500 },
      );
    }

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

  const safePaymentUrl = validatePaymentUrl(course.payment_url);
  if (safePaymentUrl) {
    return NextResponse.json({ ok: true, redirect: safePaymentUrl });
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
    console.error("requestPendingEnrollment:", error);
    return NextResponse.json(
      {
        error:
          error.includes("payments") || error.includes("service")
            ? error
            : "Не вдалося створити заявку. Перевірте налаштування LiqPay у Vercel (LIQPAY_PUBLIC_KEY, LIQPAY_PRIVATE_KEY; для тестів LIQPAY_SANDBOX=1).",
      },
      { status: 500 },
    );
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
