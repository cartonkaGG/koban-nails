"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";

type Props = {
  profile?: Profile | null;
};

export function LandingTopbar({ profile = null }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
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

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  return (
    <>
      <header className={`landing-topbar${scrolled ? " scrolled" : ""}`} id="topbar">
        <div className="landing-topbar-inner">
          <nav className="landing-nav shell" aria-label="Головна навігація">
            <Link className="landing-brand" href="/#top">
              <span className="landing-brand-mark">K</span>
              <span>Koban nails</span>
            </Link>

            <div className={`landing-nav-links${menuOpen ? " open" : ""}`} id="navLinks">
              <Link href="/#courses" onClick={() => setMenuOpen(false)}>Курси</Link>
              <Link href="/#format" onClick={() => setMenuOpen(false)}>Формат</Link>
              <Link href="/#reviews" onClick={() => setMenuOpen(false)}>Відгуки</Link>
              <Link href="/#faq" onClick={() => setMenuOpen(false)}>Питання</Link>
              {profile ? (
                <>
                  {profile.role === "admin" && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}>Адмін</Link>
                  )}
                  <Link href="/cabinet" onClick={() => setMenuOpen(false)}>Кабінет</Link>
                </>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)}>Увійти</Link>
              )}
            </div>

            <Link
              className="landing-btn landing-btn-sell landing-nav-cta"
              href={profile ? "/cabinet/profile" : "/login"}
            >
              {profile ? "Профіль" : "Увійти"}
            </Link>

            <button
              className="landing-menu-btn"
              type="button"
              aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg className="icon-open" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <svg className="icon-close" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      <button
        type="button"
        className={`landing-menu-backdrop${menuOpen ? " open" : ""}`}
        aria-hidden={!menuOpen}
        aria-label="Закрити меню"
        onClick={() => setMenuOpen(false)}
      />
    </>
  );
}
