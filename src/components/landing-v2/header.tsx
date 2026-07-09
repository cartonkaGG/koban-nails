"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { AuthTrigger } from "@/components/auth/auth-trigger";
import type { Profile } from "@/lib/types";

const links = [
  { label: "Курси", href: "#courses" },
  { label: "Про мене", href: "#about" },
  { label: "Відгуки", href: "#reviews" },
  { label: "Контакти", href: "#footer" },
];

type Props = {
  profile?: Profile | null;
  /** Prefix for nav/logo anchors. Use "/" on non-home pages so links jump to the homepage sections. */
  linkBase?: string;
};

export function LandingV2Header({ profile: initialProfile = null, linkBase = "" }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);

  useEffect(() => {
    if (initialProfile) return;
    let cancelled = false;

    const refreshSession = () => {
      fetch("/api/auth/session", { credentials: "same-origin" })
        .then((res) => res.json())
        .then((data: { loggedIn?: boolean; profile?: Profile }) => {
          if (cancelled) return;
          if (data.loggedIn && data.profile) {
            setProfile(data.profile as Profile);
          } else {
            setProfile(null);
          }
        })
        .catch(() => {});
    };

    refreshSession();

    const onVisible = () => {
      if (document.visibilityState === "visible") refreshSession();
    };
    window.addEventListener("focus", refreshSession);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshSession);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initialProfile]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cta = profile ? (
    <Link
      href="/cabinet"
      className="hidden rounded-full border border-v2-ink/15 bg-white/60 px-6 py-2.5 text-sm font-semibold text-v2-ink shadow-sm transition-colors hover:border-v2-clay hover:text-v2-clay md:inline-block"
    >
      Мої курси
    </Link>
  ) : (
    <AuthTrigger className="hidden rounded-full border border-v2-ink/15 bg-white/60 px-6 py-2.5 text-sm font-semibold text-v2-ink shadow-sm transition-colors hover:border-v2-clay hover:text-v2-clay md:inline-block">
      Увійти
    </AuthTrigger>
  );

  const mobileCta = profile ? (
    <Link
      href="/cabinet"
      onClick={() => setOpen(false)}
      className="mt-2 block rounded-full bg-v2-ink px-5 py-3 text-center text-sm font-semibold text-v2-cream"
    >
      Мої курси
    </Link>
  ) : (
    <AuthTrigger
      className="mt-2 block w-full rounded-full bg-v2-ink px-5 py-3 text-center text-sm font-semibold text-v2-cream"
      onClick={() => setOpen(false)}
    >
      Увійти
    </AuthTrigger>
  );

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`transition-all duration-500 ${
          scrolled
            ? "bg-v2-cream/85 backdrop-blur-xl shadow-[0_10px_30px_-20px_rgba(90,70,55,0.4)]"
            : "bg-transparent"
        }`}
      >
        <nav className="container-px flex h-[72px] items-center justify-between">
          <a href={linkBase || "#top"} className="flex items-center gap-2">
            <span className="font-v2-display text-2xl font-semibold tracking-[0.25em] text-v2-ink">
              KOBAN
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.35em] text-v2-clay">
              nails
            </span>
          </a>

          <ul className="hidden items-center gap-9 md:flex">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={`${linkBase}${l.href}`}
                  className="group relative text-sm font-medium text-v2-ink-soft transition-colors hover:text-v2-ink"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-v2-clay transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            {cta}
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-full border border-v2-ink/10 bg-white/60 text-v2-ink md:hidden"
              aria-label="Меню"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-v2-ink/5 bg-v2-cream/95 backdrop-blur-xl md:hidden"
          >
            <ul className="container-px flex flex-col gap-1 py-4">
              {links.map((l) => (
                <li key={l.label}>
                  <a
                    href={`${linkBase}${l.href}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-3 text-base font-medium text-v2-ink-soft transition-colors hover:bg-v2-sand hover:text-v2-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>{mobileCta}</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
