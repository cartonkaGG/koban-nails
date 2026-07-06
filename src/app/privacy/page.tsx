import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { businessInfo } from "@/content/business";
import { privacySections } from "@/content/legal";

export const metadata = {
  title: "Політика конфіденційності | Koban Nails",
  description: "Політика конфіденційності та обробки персональних даних Koban Nails.",
};

const relatedLinks = [
  { href: "/offer", label: "← Публічна оферта" },
  { href: "/refund", label: "Політика повернення коштів" },
];

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      eyebrow="документи"
      title="Політика конфіденційності"
      subtitle={`Редакція від ${businessInfo.legalRevision}`}
      sections={privacySections}
      relatedLinks={relatedLinks}
    />
  );
}
