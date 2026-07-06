import { offerSections } from "@/content/legal-offer";
import { privacySections } from "@/content/legal";
import { refundSections } from "@/content/legal-refund";
import { businessInfo } from "@/content/business";
import type { LegalSection } from "@/content/legal";

export type LegalDocSlug = "offer" | "privacy" | "refund";

type LegalDocDefinition = {
  title: string;
  subtitle?: string;
  sections: LegalSection[];
  filename: string;
};

export const legalDocuments: Record<LegalDocSlug, LegalDocDefinition> = {
  offer: {
    title: "Публічна оферта",
    subtitle: `про укладення договору про надання освітніх послуг · Редакція від ${businessInfo.legalRevision}`,
    sections: offerSections,
    filename: "publichna-oferta-koban-nails.pdf",
  },
  privacy: {
    title: "Політика конфіденційності",
    subtitle: `Редакція від ${businessInfo.legalRevision}`,
    sections: privacySections,
    filename: "polityka-konfidentsiynosti-koban-nails.pdf",
  },
  refund: {
    title: "Політика повернення коштів",
    subtitle: `Редакція від ${businessInfo.legalRevision}`,
    sections: refundSections,
    filename: "polityka-povernennya-koban-nails.pdf",
  },
};

export function isLegalDocSlug(value: string): value is LegalDocSlug {
  return value in legalDocuments;
}
