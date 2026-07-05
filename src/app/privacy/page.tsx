import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { privacySections } from "@/content/legal";

export const metadata = {
  title: "Політика конфіденційності | Koban nails",
  description: "Політика конфіденційності та обробки персональних даних Koban Nails.",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      eyebrow="документи"
      title="Політика конфіденційності"
      sections={privacySections}
      relatedLinks={[{ href: "/terms", label: "← Умови використання" }]}
    />
  );
}
