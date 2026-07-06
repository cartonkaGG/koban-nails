import type { Course } from "@/lib/types";

export type CourseHeroCopy = {
  headline: string;
  subheadline: string;
  ctaLabel: string;
};

export type CourseMarketing = {
  tagline: string;
  headline: string;
  subheadline: string;
  /** Коротка версія для hero — менше тексту, сильніший фокус на конверсію */
  hero?: CourseHeroCopy;
  pitch: { before: string; accent: string; after: string };
  bonuses: string[];
  reasons: { title: string; text: string }[];
  forYouIf: { title: string; text: string }[];
  painPoints: { title: string; text: string }[];
  proof: string[];
  urgencyLabel: string;
};

const DEFAULT_REASONS: CourseMarketing["reasons"] = [
  {
    title: "Структура замість хаосу",
    text: "Покрокова програма — від підготовки до фінальної роботи без пропусків важливих етапів.",
  },
  {
    title: "Практика з першого уроку",
    text: "Відео + домашні завдання з розбором — ви вчитесь на реальних кейсах, а не лише дивитесь.",
  },
  {
    title: "Доступ одразу після оплати",
    text: "Курс відкривається в кабінеті миттєво — можна почати сьогодні, у зручному темпі.",
  },
];

const DEFAULT_FOR_YOU: CourseMarketing["forYouIf"] = [
  {
    title: "Хочете увійти в професію",
    text: "Потрібна база з нуля — без прогалин у знаннях і техніці.",
  },
  {
    title: "Працюєте вдома або в студії",
    text: "Хочете систематизувати навички та підвищити впевненість.",
  },
  {
    title: "Навчаєтесь у своєму темпі",
    text: "Онлайн-формат без жорсткого графіку та зручний доступ до уроків.",
  },
  {
    title: "Шукаєте вигідний старт",
    text: "Якісна база без витрат на проїзд, проживання та офлайн-групи.",
  },
];

const DEFAULT_PAIN: CourseMarketing["painPoints"] = [
  {
    title: "Немає системи в навчанні",
    text: "Розрізнені відео не дають цілісної картини — важко зрозуміти, з чого почати.",
  },
  {
    title: "Страх першого клієнта",
    text: "Теорія є, але не вистачає впевненості в стерилізації, формі та покритті.",
  },
  {
    title: "Немає зворотного зв'язку",
    text: "Помилки закріплюються, бо ніхто не підказує, що виправити в роботі.",
  },
];

const BY_SLUG: Record<string, Partial<CourseMarketing>> = {
  online: {
    tagline: "Basic Start",
    headline: "Basic Start — від нуля до впевненого манікюру",
    subheadline:
      "Онлайн-курс для тих, хто хоче увійти в професію або систематизувати базу без поїздок у студію.",
    pitch: {
      before: "Забудь про хаотичне навчання з випадкових відео. ",
      accent: "Система Basic Start за 6 місяців",
      after: " — від стерилізації та комбінованого манікюру до впевненої роботи з клієнтом.",
    },
    bonuses: [
      "Чек-лист стерилізації та безпеки",
      "Шаблони для соцмереж майстра",
      "Доступ до оновлень програми",
    ],
    reasons: [
      {
        title: "Покрокова програма",
        text: "Комбінований манікюр, покриття, стерилізація — без пропусків важливих етапів.",
      },
      {
        title: "6 місяців доступу",
        text: "Переглядайте уроки у своєму темпі та повертайтесь до складних тем.",
      },
      {
        title: "Кураторський фідбек",
        text: "Надсилайте домашні роботи — отримуйте коментарі та виправляйте помилки.",
      },
    ],
    forYouIf: [
      {
        title: "Старт з нуля",
        text: "Хочете увійти в нішу манікюру з міцною базою, а не з фрагментарних порад.",
      },
      {
        title: "Вже практикуєте",
        text: "Потрібно закрити прогалини в техніці та впорядкувати процес роботи.",
      },
      {
        title: "Онлайн-формат",
        text: "Навчаєтесь у зручний час — без прив'язки до розкладу групи.",
      },
      {
        title: "Економія на офлайні",
        text: "Та сама якість навчання без витрат на проїзд і проживання.",
      },
    ],
    painPoints: [
      {
        title: "Плутанина в техніках",
        text: "Багато порад онлайн, але немає чіткого маршруту — від чого почати і що робити далі.",
      },
      {
        title: "Низька впевненість",
        text: "Страшно брати клієнта, бо не впевнені в стерилізації, формі та стійкості покриття.",
      },
      {
        title: "Немає підтримки",
        text: "Помилки повторюються, бо ніхто не дивиться на ваші роботи і не дає фідбек.",
      },
    ],
    proof: ["200+ учнів", "4.9 ★ рейтинг", "Сертифікат після курсу"],
    hero: {
      headline: "Від нуля до впевненого манікюру",
      subheadline: "6 місяців онлайн: система, практика й фідбек куратора.",
      ctaLabel: "Отримати доступ зі знижкою",
    },
  },
  basic: {
    tagline: "Basic Start",
    headline: "Basic Start — фундамент майстра в студії",
    subheadline: "Офлайн-практика на моделях з наглядом інструктора — для тих, хто любить живий контакт.",
    pitch: {
      before: "Живий контакт з інструктором і моделями. ",
      accent: "Практика в студії Koban Nails",
      after: " — від інструменту до впевненої роботи з клієнтом.",
    },
    bonuses: ["Робота на моделях", "Малі групи", "Сертифікат після курсу"],
    proof: ["Практика на моделях", "Сертифікат", "Малі групи"],
    hero: {
      headline: "Фундамент майстра в студії",
      subheadline: "Офлайн-практика на моделях з наглядом інструктора.",
      ctaLabel: "Отримати доступ зі знижкою",
    },
  },
  pro: {
    tagline: "Pro Level",
    headline: "Pro — швидше, чистіше, дорожче",
    subheadline: "Для діючих майстрів: прискорення, тонке покриття та розбір ваших реальних робіт.",
    pitch: {
      before: "Для майстрів, які вже працюють. ",
      accent: "Підвищення швидкості та якості",
      after: " — тонке покриття, чисті кутикули та розбір ваших робіт.",
    },
    bonuses: ["Розбір ваших робіт", "Преміум-техніки", "Сертифікат"],
    proof: ["Підвищення кваліфікації", "Розбір робіт", "Преміум-техніки"],
    hero: {
      headline: "Швидше, чистіше, дорожче",
      subheadline: "Для діючих майстрів — прискорення та розбір ваших робіт.",
      ctaLabel: "Отримати доступ зі знижкою",
    },
  },
};

const DEFAULT_PITCH: CourseMarketing["pitch"] = {
  before: "Структуроване навчання замість хаосу. ",
  accent: "Покрокова програма Koban Nails",
  after: " — від бази до впевненої практики з клієнтами.",
};

const DEFAULT_BONUSES = ["Доступ до уроків", "Підтримка куратора", "Сертифікат після курсу"];

const DEFAULT_HERO_CTA = "Отримати доступ зі знижкою";

export function getCourseHeroCopy(marketing: CourseMarketing): CourseHeroCopy {
  return {
    headline: marketing.hero?.headline ?? marketing.headline,
    subheadline: marketing.hero?.subheadline ?? marketing.subheadline,
    ctaLabel: marketing.hero?.ctaLabel ?? DEFAULT_HERO_CTA,
  };
}

export function getCourseMarketing(course: Course): CourseMarketing {
  const custom = BY_SLUG[course.slug] ?? {};

  return {
    tagline: custom.tagline ?? "Старт у професії",
    headline: custom.headline ?? `${course.title} — навчання з Koban Nails`,
    subheadline: custom.subheadline ?? course.description,
    pitch: custom.pitch ?? DEFAULT_PITCH,
    bonuses: custom.bonuses ?? DEFAULT_BONUSES,
    reasons: custom.reasons ?? DEFAULT_REASONS,
    forYouIf: custom.forYouIf ?? DEFAULT_FOR_YOU,
    painPoints: custom.painPoints ?? DEFAULT_PAIN,
    proof: custom.proof ?? ["Онлайн-формат", "Підтримка", "Сертифікат"],
    urgencyLabel: custom.urgencyLabel ?? "Спеціальна ціна діє ще",
  };
}
