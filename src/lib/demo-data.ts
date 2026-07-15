import type { Course, Enrollment, Lesson, Profile } from "./types";

export const DEMO_PROFILE: Profile = {
  id: "demo-user",
  email: "student@koban.nails",
  full_name: "Анна Коваленко",
  phone: "+380 67 000 00 00",
  role: "student",
  avatar_url: null,
  created_at: new Date().toISOString(),
};

export const DEMO_ADMIN: Profile = {
  id: "demo-admin",
  email: "admin@koban.nails",
  full_name: "Koban Admin",
  phone: null,
  role: "admin",
  avatar_url: null,
  created_at: new Date().toISOString(),
};

export const DEMO_COURSES: Course[] = [
  {
    id: "2",
    slug: "online",
    title: "Online",
    description: "Навчання у власному темпі з перевіркою робіт.",
    detailed_description: null,
    format: "online",
    price_uah: 7900,
    sale_price_uah: 5900,
    offer_countdown_enabled: true,
    image_url: "/course-online.png",
    badge: "онлайн",
    featured: true,
    published: true,
    features: [
      "Відеоуроки на 6 місяців",
      "Домашні завдання",
      "Коментарі куратора",
      "Фінальна робота",
    ],
    payment_url: null,
    sort_order: 1,
    archived_at: null,
    certificate_template_url: null,
  },
  {
    id: "3",
    slug: "pro",
    title: "Pro",
    description: "Для майстрів, які хочуть працювати швидше і чистіше — онлайн.",
    detailed_description: null,
    format: "online",
    price_uah: 9500,
    sale_price_uah: null,
    offer_countdown_enabled: false,
    image_url: "/course-pro.png",
    badge: "підвищення",
    featured: false,
    published: true,
    features: [
      "Корекція техніки",
      "Тонке покриття",
      "Швидкий френч",
      "Розбір ваших робіт",
    ],
    payment_url: null,
    sort_order: 2,
    archived_at: null,
    certificate_template_url: null,
  },
];

export const DEMO_LESSONS: Lesson[] = [
  {
    id: "l1",
    course_id: "2",
    title: "Вступ до курсу",
    summary: "Організація навчання та матеріали",
    content:
      "У цьому уроці ви дізнаєтесь, як проходить онлайн-навчання, які матеріали потрібні та як надсилати домашні завдання на перевірку.",
    video_url: null,
    duration_min: 8,
    sort_order: 1,
  },
  {
    id: "l2",
    course_id: "2",
    title: "Підготовка та стерилізація",
    summary: "Безпека та робоче місце",
    content:
      "Розбираємо стерилізацію інструментів, дезінфекцію поверхонь і правильну організацію робочого місця майстра.",
    video_url: null,
    duration_min: 14,
    sort_order: 2,
  },
  {
    id: "l3",
    course_id: "2",
    title: "Комбінований манікюр",
    summary: "Техніка зрізу та обробки",
    content:
      "Покроковий алгоритм комбінованого манікюру: підготовка, зріз, полірування та безпечна робота з кутикулою.",
    video_url: null,
    duration_min: 22,
    sort_order: 3,
  },
  {
    id: "l4",
    course_id: "2",
    title: "Покриття та вирівнювання",
    summary: "Рівна база без подтеків",
    content:
      "Вчимося наносити базу та гель-лак рівно, контролювати товщину та уникати подтеків біля кутикули.",
    video_url: null,
    duration_min: 18,
    sort_order: 4,
  },
  {
    id: "l5",
    course_id: "2",
    title: "Фінальна робота",
    summary: "Здача проєкту",
    content:
      "Зніміть фінальну роботу за чеклістом і надішліть на перевірку. Після оцінювання отримаєте сертифікат.",
    video_url: null,
    duration_min: 12,
    sort_order: 5,
  },
];

export const DEMO_ENROLLMENTS: Enrollment[] = [
  {
    id: "e1",
    user_id: "demo-user",
    course_id: "2",
    status: "active",
    purchased_at: new Date().toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
    course: DEMO_COURSES[0],
  },
];
