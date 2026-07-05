import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/cabinet-shell";
import { getProfile } from "@/lib/auth";
import { getUserEnrollments } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/types";

export default async function CabinetPage() {
  const profile = await getProfile();
  if (!profile) redirect("/?auth=login&next=/cabinet");

  const enrollments = await getUserEnrollments(profile.id);

  return (
    <CabinetShell profile={profile}>
      <div className="mb-8">
        <p className="eyebrow">навчання</p>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl">Мої курси</h2>
        <p className="mt-2 text-sm text-cream-body">
          Тут з&apos;являються програми після покупки. Онлайн-курси можна проходити одразу.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="card text-center">
          <p className="text-cream-body">У вас ще немає активних курсів.</p>
          <Link href="/#courses" className="btn btn-primary mt-4 inline-flex">Обрати курс</Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            if (!course) return null;
            const canLearn = enrollment.status === "active" && course.format === "online";
            return (
              <article key={enrollment.id} className="card overflow-hidden p-0">
                <div className="relative aspect-[16/9]">
                  {course.image_url && (
                    <Image src={course.image_url} alt={course.title} fill className="object-cover" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="badge">{course.badge ?? course.format}</span>
                    <span className="text-xs uppercase tracking-wide text-muted">{enrollment.status}</span>
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl">{course.title}</h3>
                  <p className="mt-2 text-sm text-cream-body">{course.description}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-muted">
                      {enrollment.purchased_at ? `Куплено ${formatDate(enrollment.purchased_at)}` : "Очікує підтвердження"}
                    </span>
                    {canLearn ? (
                      <Link href={`/cabinet/courses/${course.slug}`} className="btn btn-primary">
                        Продовжити навчання
                      </Link>
                    ) : (
                      <span className="text-sm text-gold">{formatPrice(course.price_uah)}</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </CabinetShell>
  );
}
