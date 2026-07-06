import Link from "next/link";
import { LandingTopbar } from "@/components/landing/topbar";
import { SiteFooter } from "@/components/site-footer";
import type { LegalDocSlug } from "@/content/legal-documents";
import type { LegalSection } from "@/content/legal";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  sections: LegalSection[];
  relatedLinks?: { href: string; label: string }[];
  pdfDoc?: LegalDocSlug;
};

function LegalBlock({ block }: { block: LegalSection["blocks"][number] }) {
  if (block.kind === "list") {
    return (
      <ul className="list-disc space-y-1.5 pl-5">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p>{block.value}</p>;
}

export function LegalDocumentPage({ eyebrow, title, subtitle, sections, relatedLinks = [], pdfDoc }: Props) {
  return (
    <>
      <LandingTopbar />
      <main className="shell py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-sm text-muted hover:text-gold">
            ← На головну
          </Link>

          <div className="mt-6 space-y-8">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
                  {title}
                </h1>
                {pdfDoc && (
                  <a
                    href={`/api/legal/${pdfDoc}`}
                    className="btn btn-ghost shrink-0 text-sm"
                    download
                  >
                    Завантажити PDF
                  </a>
                )}
              </div>
              {subtitle && (
                <p className="mt-3 text-sm text-muted">{subtitle}</p>
              )}
            </div>

            {sections.map((section) => (
              <section key={section.title} className="card space-y-3 text-sm leading-relaxed text-cream-body">
                <h2 className="font-medium text-cream">{section.title}</h2>
                {section.blocks.map((block, index) => (
                  <LegalBlock key={`${section.title}-${index}`} block={block} />
                ))}
              </section>
            ))}

            {relatedLinks.length > 0 && (
              <div className="flex flex-wrap gap-4 text-sm">
                {relatedLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-gold hover:underline">
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
