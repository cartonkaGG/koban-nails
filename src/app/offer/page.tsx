import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { businessInfo } from "@/content/business";
import { offerSections } from "@/content/legal-offer";

export const metadata = {
  title: "Публічна оферта | Koban Nails",
  description: "Публічна оферта про укладення договору про надання освітніх послуг Koban Nails.",
};

const relatedLinks = [
  { href: "/privacy", label: "Політика конфіденційності" },
  { href: "/refund", label: "Політика повернення коштів" },
  { href: "/services", label: "Опис освітніх послуг" },
];

export default function OfferPage() {
  return (
    <LegalDocumentPage
      eyebrow="документи"
      title="Публічна оферта"
      subtitle={`про укладення договору про надання освітніх послуг · Редакція від ${businessInfo.legalRevision}`}
      sections={offerSections}
      relatedLinks={relatedLinks}
      pdfDoc="offer"
    />
  );
}
