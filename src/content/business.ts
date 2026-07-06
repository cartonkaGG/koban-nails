export const businessInfo = {
  legalName: "ФОП Кобан Галина Андріївна",
  ownerName: "Кобан Галина Андріївна",
  brandName: "Koban Nails",
  rnokpp: "3086412544",
  address:
    "Україна, Волинська область, м. Луцьк, бульвар Івана Газюка, буд. 9, кв. 133",
  email: "galakoban@gmail.com",
  phone: "+380668438015",
  phoneDisplay: "+38 (066) 843-80-15",
  instagram: {
    url: "https://www.instagram.com/koban_nails/",
    handle: "@koban_nails",
  },
  legalRevision: "06 липня 2026 року",
} as const;

export const legalNavLinks = [
  { href: "/offer", label: "Оферта" },
  { href: "/privacy", label: "Конфіденційність" },
  { href: "/refund", label: "Повернення" },
] as const;

export function fopRequisitesBlocks() {
  return [
    { kind: "text" as const, value: `Фізична особа-підприємець: ${businessInfo.ownerName}` },
    { kind: "text" as const, value: `Бренд: ${businessInfo.brandName}` },
    { kind: "text" as const, value: `РНОКПП: ${businessInfo.rnokpp}` },
    { kind: "text" as const, value: `Адреса: ${businessInfo.address}` },
    { kind: "text" as const, value: `E-mail: ${businessInfo.email}` },
    { kind: "text" as const, value: `Телефон: ${businessInfo.phoneDisplay}` },
    { kind: "text" as const, value: `Instagram: ${businessInfo.instagram.handle}` },
  ];
}
