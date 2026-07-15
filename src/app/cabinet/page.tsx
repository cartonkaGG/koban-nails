import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/cabinet-shell";
import { CertificateDownloadButton } from "@/components/cabinet/certificate-download-button";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { getLessonsForCourse, getUserEnrollments } from "@/lib/data";
import { syncPaidCoursesForUser } from "@/lib/enrollments";
import { resolveCourseImageUrl } from "@/lib/images";
import { isLiqPayConfigured } from "@/lib/liqpay/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getCourseProgress(userId: string, lessonIds: string[]) {
  if (lessonIds.length === 0) return 0;
  if (!isSupabaseConfigured()) return 20;

  const supabase = await createClient();
  const { count } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("completed", true)
    .in("lesson_id", lessonIds);

  return Math.round(((count ?? 0) / lessonIds.length) * 100);
}

export default async function CabinetPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string; payment?: string }>;
}) {
  const { pending: pendingQuery, payment: paymentQuery } = await searchParams;

  const profile = await getProfile();
  if (!profile) {
    const nextPath =
      paymentQuery != null && paymentQuery !== ""
        ? `/cabinet?payment=${encodeURIComponent(paymentQuery)}`
        : "/cabinet";
    redirect(`/?auth=login&next=${encodeURIComponent(nextPath)}`);
  }

  let enrollments = await getUserEnrollments(profile.id);
  const hadPending = enrollments.some((item) => item.status === "pending");

  // Buyer return from LiqPay, or catch-up if webhook raced the redirect.
  if (
    isSupabaseConfigured() &&
    (paymentQuery === "success" ||
      paymentQuery === "processing" ||
      pendingQuery === "1" ||
      hadPending)
  ) {
    const sync = await syncPaidCoursesForUser(profile.id);
    if (sync.error) {
      console.error("cabinet syncPaidCoursesForUser:", sync.error);
    } else if (sync.activated > 0 || hadPending) {
      enrollments = await getUserEnrollments(profile.id);
    }
  }

  const pendingEnrollments = enrollments.filter((item) => item.status === "pending");
  const activeEnrollments = enrollments.filter(
    (item) =>
      (item.status === "active" || item.status === "completed") &&
      item.course?.format === "online",
  );

  const cards = await Promise.all(
    activeEnrollments.map(async (enrollment) => {
      const course = enrollment.course!;
      const lessons = await getLessonsForCourse(course.id);
      const progress = await getCourseProgress(
        profile.id,
        lessons.map((lesson) => lesson.id),
      );
      return { enrollment, course, lessons, progress };
    }),
  );

  const paymentJustSucceeded =
    paymentQuery === "success" || paymentQuery === "processing";
  const showAutoUnlockHint = paymentJustSucceeded && cards.length > 0;
  const showWaitingPayment =
    paymentJustSucceeded && cards.length === 0 && isLiqPayConfigured();
  const showAdminPending =
    !paymentJustSucceeded &&
    (pendingQuery === "1" || pendingEnrollments.length > 0);

  return (
    <CabinetShell profile={profile}>
      <div className="cabinet-intro">
        <h1 className="cabinet-title">Мої курси</h1>
        <p className="cabinet-subtitle">
          {cards.length > 0
            ? "Оберіть курс, щоб переглянути уроки."
            : "Після покупки курс з&apos;явиться тут."}
        </p>
      </div>

      {showAutoUnlockHint && (
        <div className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-cream-body">
          Оплату підтверджено — курс уже у вашому кабінеті.
        </div>
      )}

      {showWaitingPayment && (
        <div className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-cream-body">
          Оплату отримано. Курс відкриється автоматично за кілька секунд — оновіть сторінку,
          якщо ще не з&apos;явився.
        </div>
      )}

      {showAdminPending && (
        <div className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-cream-body">
          {pendingEnrollments.length > 0 ? (
            <>
              {isLiqPayConfigured() ? (
                <>
                  Очікується підтвердження оплати:{" "}
                  <strong className="text-cream">
                    {pendingEnrollments.map((e) => e.course?.title).filter(Boolean).join(", ")}
                  </strong>
                  . Після успішної оплати LiqPay курс відкриється автоматично.
                </>
              ) : (
                <>
                  Очікується підтвердження оплати:{" "}
                  <strong className="text-cream">
                    {pendingEnrollments.map((e) => e.course?.title).filter(Boolean).join(", ")}
                  </strong>
                  . Курс відкриється після перевірки адміністратором.
                </>
              )}
            </>
          ) : (
            <>Заявку на оплату надіслано. Курс з&apos;явиться після підтвердження.</>
          )}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="cabinet-empty">
          <p>У вас ще немає курсів.</p>
          <Link href="/#courses" className="btn btn-primary mt-5 inline-flex">
            Обрати курс
          </Link>
        </div>
      ) : (
        <ul className="cabinet-course-list">
          {cards.map(({ course, lessons, progress }) => (
            <li key={course.id}>
              <article className="cabinet-course-card">
                <div className="cabinet-course-thumb">
                  {resolveCourseImageUrl(course.image_url) ? (
                    <Image src={resolveCourseImageUrl(course.image_url)!} alt="" fill className="object-cover" sizes="120px" />
                  ) : (
                    <div className="cabinet-course-thumb-fallback" />
                  )}
                </div>

                <div className="cabinet-course-body">
                  <div className="cabinet-course-top">
                    <h2 className="cabinet-course-name">{course.title}</h2>
                    <span className="cabinet-course-meta">{lessons.length} уроків</span>
                  </div>

                  <div className="cabinet-progress">
                    <div className="cabinet-progress-bar">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <span className="cabinet-progress-label">{progress}%</span>
                  </div>

                  <Link href={`/cabinet/courses/${course.slug}`} className="btn btn-primary cabinet-course-cta">
                    Переглянути курс
                  </Link>

                  {progress === 100 && course.certificate_template_url && profile.full_name?.trim() && (
                    <CertificateDownloadButton courseSlug={course.slug} compact />
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </CabinetShell>
  );
}
