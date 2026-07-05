import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { termsSections } from "@/content/legal";

export const metadata = {
  title: "Умови використання | Koban nails",
  description: "Умови використання сайту Koban Nails та правила надання онлайн-курсів.",
};

export default function TermsPage() {
  return (
    <LegalDocumentPage
      eyebrow="документи"
      title="Умови використання"
      sections={termsSections}
      relatedLinks={[{ href: "/privacy", label: "Політика конфіденційності →" }]}
    />
  );
}
