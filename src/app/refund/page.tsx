import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { businessInfo } from "@/content/business";
import { refundSections } from "@/content/legal-refund";

export const metadata = {
  title: "Політика повернення коштів | Koban Nails",
  description: "Політика повернення коштів за освітні послуги Koban Nails.",
};

const relatedLinks = [
  { href: "/offer", label: "← Публічна оферта" },
  { href: "/privacy", label: "Політика конфіденційності" },
  { href: "/services", label: "Опис освітніх послуг" },
];

export default function RefundPage() {
  return (
    <LegalDocumentPage
      eyebrow="документи"
      title="Політика повернення коштів"
      subtitle={`Редакція від ${businessInfo.legalRevision}`}
      sections={refundSections}
      relatedLinks={relatedLinks}
      pdfDoc="refund"
    />
  );
}
