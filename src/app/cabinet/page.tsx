import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/cabinet-shell";
import { getProfile, isSupabaseConfigured } from "@/lib/auth";
import { getLessonsForCourse, getUserEnrollments } from "@/lib/data";
import { resolveCourseImageUrl } from "@/lib/images";
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

export default async function CabinetPage() {
  const profile = await getProfile();
  if (!profile) redirect("/?auth=login&next=/cabinet");

  const enrollments = await getUserEnrollments(profile.id);
  const activeEnrollments = enrollments.filter(
    (item) => item.status === "active" && item.course?.format === "online",
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
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </CabinetShell>
  );
}
