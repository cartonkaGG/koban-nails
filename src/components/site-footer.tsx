import Link from "next/link";
import { businessInfo, legalNavLinks } from "@/content/business";

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell site-footer-bar">
        <div className="site-footer-brand-col">
          <p className="site-footer-logo">{businessInfo.brandName}</p>
          <p className="site-footer-legal">{businessInfo.legalName}</p>
          <p className="site-footer-requisite">РНОКПП: {businessInfo.rnokpp}</p>
          <p className="site-footer-requisite">{businessInfo.address}</p>
        </div>

        <div className="site-footer-contacts-col">
          <a href={`mailto:${businessInfo.email}`} className="site-footer-contact">
            {businessInfo.email}
          </a>
          <a href={`tel:${businessInfo.phone}`} className="site-footer-contact">
            {businessInfo.phoneDisplay}
          </a>
          <a
            href={businessInfo.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-social"
            aria-label={`Instagram ${businessInfo.instagram.handle}`}
          >
            <InstagramIcon />
            <span>{businessInfo.instagram.handle}</span>
          </a>
        </div>

        <nav className="site-footer-legal-col" aria-label="Юридичні документи">
          {legalNavLinks.map((link, index) => (
            <span key={link.href} className="site-footer-legal-item">
              {index > 0 && (
                <span className="site-footer-dot" aria-hidden="true">
                  ·
                </span>
              )}
              <Link href={link.href} className="site-footer-legal-link">
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>

      <div className="shell site-footer-bottom">
        <p>
          © {year} {businessInfo.brandName}
        </p>
      </div>
    </footer>
  );
}
