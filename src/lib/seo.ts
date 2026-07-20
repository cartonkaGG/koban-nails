import type { Metadata } from "next";
import { businessInfo } from "@/content/business";
import { landingFaq } from "@/content/faq";
import type { Course } from "@/lib/types";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { getEffectiveCoursePrice } from "@/lib/types";

const DEFAULT_TITLE = "Koban Nails — онлайн-курси манікюру від Галини Кобан";
const DEFAULT_DESCRIPTION =
  "Онлайн-курси манікюру та педикюру з сертифікатом. Навчання від нуля, підтримка наставника, доступ у кабінеті 24/7. Україна.";

const KEYWORDS = [
  "курси манікюру онлайн",
  "навчання манікюру",
  "курси манікюру Україна",
  "Koban Nails",
  "Галина Кобан",
  "манікюр для початківців",
  "курси педикюру онлайн",
  "навчання nail майстра",
].join(", ");

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Koban Nails",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: businessInfo.ownerName, url: SITE_URL }],
  creator: businessInfo.brandName,
  publisher: businessInfo.legalName,
  category: "education",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: SITE_URL,
    siteName: businessInfo.brandName,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export function courseMetadata(course: Course, imageUrl?: string | null): Metadata {
  const title = course.title;
  const description =
    course.description ||
    `Онлайн-курс «${course.title}» від ${businessInfo.ownerName}. Формат: ${course.format === "online" ? "онлайн" : "офлайн"}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/courses/${course.slug}`,
    },
    openGraph: {
      type: "website",
      locale: "uk_UA",
      url: absoluteUrl(`/courses/${course.slug}`),
      title: `${title} | ${businessInfo.brandName}`,
      description,
      images: imageUrl ? [{ url: imageUrl, alt: course.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${businessInfo.brandName}`,
      description,
    },
  };
}

export function buildOrganizationSchema() {
  return {
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: businessInfo.brandName,
    legalName: businessInfo.legalName,
    url: SITE_URL,
    logo: absoluteUrl("/apple-icon"),
    image: absoluteUrl("/opengraph-image"),
    description: DEFAULT_DESCRIPTION,
    email: businessInfo.email,
    telephone: businessInfo.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "бульвар Івана Газюка, буд. 9, кв. 133",
      addressLocality: "Луцьк",
      addressRegion: "Волинська область",
      addressCountry: "UA",
    },
    areaServed: {
      "@type": "Country",
      name: "Україна",
    },
    founder: {
      "@type": "Person",
      name: businessInfo.ownerName,
      jobTitle: "Інструктор курсів манікюру та педикюру",
    },
    sameAs: [businessInfo.instagram.url],
  };
}

export function buildWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: businessInfo.brandName,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "uk-UA",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function buildFaqSchema() {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: landingFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildCourseSchema(course: Course, imageUrl?: string | null) {
  const price = getEffectiveCoursePrice(course);

  return {
    "@type": "Course",
    "@id": absoluteUrl(`/courses/${course.slug}`),
    name: course.title,
    description: course.description,
    url: absoluteUrl(`/courses/${course.slug}`),
    provider: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "uk",
    educationalLevel: "Beginner to intermediate",
    teaches: "Манікюр, педикюр, nail-дизайн",
    ...(imageUrl ? { image: imageUrl } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/checkout/${course.slug}`),
      price: price,
      priceCurrency: "UAH",
      availability: "https://schema.org/InStock",
      category: "Paid",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: course.format === "online" ? "online" : "onsite",
      courseWorkload: "Paced",
    },
  };
}

export function buildHomeGraph(courses: Course[], courseImages: Record<string, string | null>) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildWebSiteSchema(),
      buildFaqSchema(),
      ...courses.map((course) => buildCourseSchema(course, courseImages[course.slug] ?? null)),
    ],
  };
}
