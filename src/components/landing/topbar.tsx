"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthTrigger } from "@/components/auth/auth-trigger";
import type { Profile } from "@/lib/types";

type Props = {
  profile?: Profile | null;
};

export function LandingTopbar({ profile = null }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const nextScrolled = window.scrollY > 40;
      setScrolled((current) => (current === nextScrolled ? current : nextScrolled));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`landing-topbar${scrolled ? " scrolled" : ""}`} id="topbar">
      <div className="landing-topbar-inner">
        <nav className="landing-nav shell" aria-label="Головна навігація">
          <Link className="landing-brand" href="/#top">
            <span className="landing-brand-mark">K</span>
            <span className="landing-brand-mark-text">Koban nails</span>
          </Link>

          <div className="landing-nav-links landing-nav-links-desktop">
            <Link href="/#courses">Курси</Link>
            <Link href="/#format">Формат</Link>
            <Link href="/#reviews">Відгуки</Link>
            <Link href="/#faq">Питання</Link>
          </div>

          {profile ? (
            <Link className="landing-btn landing-btn-sell landing-nav-cta" href="/cabinet">
              Мої курси
            </Link>
          ) : (
            <AuthTrigger className="landing-btn landing-btn-sell landing-nav-cta">
              Увійти
            </AuthTrigger>
          )}
        </nav>
      </div>
    </header>
  );
}
