import Link from "next/link";
import { FooterAuthLink } from "@/components/auth/site-auth-button";
import { businessInfo } from "@/content/business";

type Props = {
  showAuthLink?: boolean;
};

export function SiteFooter({ showAuthLink = true }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer border-t border-line/60">
      <div className="shell site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <p className="site-footer-legal">{businessInfo.legalName}</p>
            <p className="site-footer-copy">
              {businessInfo.brandName} © {year}
            </p>
          </div>

          <div className="site-footer-contacts">
            <a href={`mailto:${businessInfo.email}`} className="site-footer-link">
              {businessInfo.email}
            </a>
            <a href={`tel:${businessInfo.phone}`} className="site-footer-link">
              {businessInfo.phoneDisplay}
            </a>
            <a
              href={businessInfo.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-link"
            >
              Instagram {businessInfo.instagram.handle}
            </a>
          </div>
        </div>

        <nav className="site-footer-nav" aria-label="Навігація внизу сторінки">
          {showAuthLink && <FooterAuthLink />}
          <Link href="/cabinet" className="site-footer-nav-link">
            Кабінет
          </Link>
          <Link href="/terms" className="site-footer-nav-link">
            Умови
          </Link>
          <Link href="/privacy" className="site-footer-nav-link">
            Конфіденційність
          </Link>
        </nav>
      </div>
    </footer>
  );
}
