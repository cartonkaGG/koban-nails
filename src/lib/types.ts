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

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
