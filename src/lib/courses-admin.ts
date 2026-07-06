import type { CourseFormat } from "@/lib/types";

export type CourseUpdateInput = {
  title?: unknown;
  slug?: unknown;
  description?: unknown;
  detailed_description?: unknown;
  format?: unknown;
  price_uah?: unknown;
  sale_price_uah?: unknown;
  offer_countdown_enabled?: unknown;
  badge?: unknown;
  featured?: unknown;
  published?: unknown;
  features?: unknown;
  payment_url?: unknown;
  sort_order?: unknown;
  image_url?: unknown;
  certificate_template_url?: unknown;
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asNullableString(value: unknown) {
  const text = asString(value);
  return text.length > 0 ? text : null;
}

function asInt(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : fallback;
}

function asNullableInt(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : null;
}

function asBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asFeatures(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

export function buildCourseUpdatePayload(body: CourseUpdateInput) {
  return {
    title: asString(body.title, "Без назви"),
    slug: asString(body.slug, `course-${Date.now()}`),
    description: asString(body.description),
    detailed_description: asNullableString(body.detailed_description),
    format: (body.format === "offline" ? "offline" : "online") as CourseFormat,
    price_uah: asInt(body.price_uah, 0),
    sale_price_uah: asNullableInt(body.sale_price_uah),
    offer_countdown_enabled: asBool(body.offer_countdown_enabled),
    badge: asNullableString(body.badge),
    featured: asBool(body.featured),
    published: asBool(body.published),
    features: asFeatures(body.features),
    payment_url: asNullableString(body.payment_url),
    sort_order: asInt(body.sort_order, 0),
    image_url: asNullableString(body.image_url),
    certificate_template_url: asNullableString(body.certificate_template_url),
  };
}

export function humanizeAdminDbError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("sale_price_uah")) {
    return "Колонка sale_price_uah відсутня в базі. Запустіть міграцію supabase/migrations/20260705_course_sale_price.sql у Supabase SQL Editor.";
  }

  if (lower.includes("offer_countdown_enabled")) {
    return "Колонка offer_countdown_enabled відсутня в базі. Запустіть міграцію supabase/migrations/20260706_course_offer_countdown.sql у Supabase SQL Editor.";
  }

  if (lower.includes("archived_at")) {
    return "Колонка archived_at відсутня в базі. Запустіть міграцію supabase/migrations/20260705_course_archived.sql у Supabase SQL Editor.";
  }

  if (lower.includes("certificate_template_url")) {
    return "Колонка certificate_template_url відсутня в базі. Запустіть міграцію supabase/migrations/20260705_course_certificate.sql у Supabase SQL Editor.";
  }

  if (lower.includes("detailed_description")) {
    return "Колонка detailed_description відсутня в базі. Запустіть міграцію supabase/migrations/20260706_course_detailed_description.sql у Supabase SQL Editor.";
  }

  if (lower.includes("payments") && (lower.includes("does not exist") || lower.includes("relation"))) {
    return "Таблиця payments відсутня в базі. Запустіть міграцію supabase/migrations/20260706_liqpay_payments.sql у Supabase SQL Editor.";
  }

  if (lower.includes("bucket") && lower.includes("not found")) {
    return "Bucket course-images не створений. Запустіть міграцію supabase/migrations/20260705_course_images.sql у Supabase SQL Editor.";
  }

  if (lower.includes("permission denied") || lower.includes("row-level security")) {
    return "Немає прав на запис у базу. Перевірте SUPABASE_SERVICE_ROLE_KEY у Vercel і роль admin у profiles.";
  }

  return message;
}
