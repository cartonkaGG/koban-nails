export type UserRole = "student" | "admin";
export type CourseFormat = "online" | "offline";
export type EnrollmentStatus = "pending" | "active" | "completed" | "cancelled";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  format: CourseFormat;
  price_uah: number;
  sale_price_uah: number | null;
  image_url: string | null;
  badge: string | null;
  featured: boolean;
  published: boolean;
  features: string[];
  payment_url: string | null;
  sort_order: number;
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  summary: string;
  content: string;
  video_url: string | null;
  duration_min: number;
  sort_order: number;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  purchased_at: string | null;
  created_at: string;
  course?: Course;
};

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
};

export function formatPrice(uah: number) {
  return new Intl.NumberFormat("uk-UA").format(uah) + " грн";
}

/** Active sale price when set and lower than the regular price. */
export function getEffectiveCoursePrice(course: Pick<Course, "price_uah" | "sale_price_uah">) {
  if (
    course.sale_price_uah != null &&
    course.sale_price_uah > 0 &&
    course.sale_price_uah < course.price_uah
  ) {
    return course.sale_price_uah;
  }
  return course.price_uah;
}

export function isCourseOnSale(course: Pick<Course, "price_uah" | "sale_price_uah">) {
  return getEffectiveCoursePrice(course) < course.price_uah;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
