"use client";

import Link from "next/link";
import { useEffect } from "react";
import { IconArrowRight } from "@/components/icons";

export function LandingHero() {
  useEffect(() => {
    const el = document.getElementById("heroInner");
    el?.classList.add("hero-loaded");
  }, []);

  return (
    <section className="landing-hero">
      <div className="shell">
        <div className="landing-hero-inner" id="heroInner">
          <h1 className="hero-line landing-h1">
            Галина <em>Кобан</em>
          </h1>
          <p className="hero-line landing-lead landing-lead-full">
            Галина Кобан — інструктор базових онлайн та офлайн курсів з манікюру та педикюру, та
            підвищення кваліфікації майстрів, топ-майстер, спікер б&apos;юті-марафонів, помічник
            судді чемпіонату та багаторазова призерка чемпіонату України
          </p>
          <p className="hero-line landing-lead landing-lead-short">
            Інструктор курсів з манікюру та педикюру. Топ-майстер і спікер б&apos;юті-марафонів.
          </p>
          <p className="hero-line landing-hero-meta mobile-only" aria-hidden="true">
            <span>Онлайн</span> · <span>Сертифікат</span> · <span>Підтримка</span>
          </p>
          <div className="hero-line landing-hero-actions">
            <Link className="landing-btn landing-btn-sell" href="/#courses">
              Обрати курс
              <IconArrowRight />
            </Link>
            <Link className="landing-btn landing-btn-ghost landing-hero-consult" href="/#faq">
              Питання перед купівлею
            </Link>
          </div>
          <p className="hero-line landing-hero-instagram">
            <Link href="/#courses">Дивіться програми та ціни нижче</Link>
          </p>
          <div className="hero-line landing-hero-proof" aria-label="Переваги та довіра">
            <div className="landing-hero-proof-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span><strong>4.9</strong> середній рейтинг</span>
            </div>
            <div className="landing-hero-proof-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span><strong>200+</strong> випускниць</span>
            </div>
            <div className="landing-hero-proof-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span>Сертифікат після курсу</span>
            </div>
          </div>
          <div className="hero-line landing-hero-strip" aria-label="Формати навчання">
            <div><strong>Online</strong><span>доступ до уроків у власному темпі</span></div>
            <div><strong>Сертифікат</strong><span>з вашим ім&apos;ям після завершення</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
