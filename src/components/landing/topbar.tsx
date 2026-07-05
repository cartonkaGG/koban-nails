"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthTrigger } from "@/components/auth/auth-trigger";
import { SmoothAnchor } from "@/components/landing/smooth-anchor";
import type { Profile } from "@/lib/types";

type Props = {
  profile?: Profile | null;
};

export function LandingTopbar({ profile: initialProfile = null }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);

  useEffect(() => {
    if (initialProfile) return;
    let cancelled = false;

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data: { loggedIn?: boolean; profile?: Profile }) => {
        if (!cancelled && data.loggedIn && data.profile) {
          setProfile(data.profile as Profile);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [initialProfile]);

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
          <Link className="landing-brand" href="/">
            <span className="landing-brand-mark">K</span>
            <span className="landing-brand-mark-text">Koban nails</span>
          </Link>

          <div className="landing-nav-links landing-nav-links-desktop">
            <SmoothAnchor id="courses">Курси</SmoothAnchor>
            <SmoothAnchor id="format">Формат</SmoothAnchor>
            <SmoothAnchor id="reviews">Відгуки</SmoothAnchor>
            <SmoothAnchor id="faq">Питання</SmoothAnchor>
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
