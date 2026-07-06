"use client";

import { SmoothAnchor } from "@/components/landing/smooth-anchor";
import { IconArrowRight } from "@/components/icons";
import { MotionHeroLine } from "@/components/motion";

export function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="shell">
        <div className="landing-hero-inner" id="heroInner">
          <MotionHeroLine as="h1" className="hero-line landing-h1" delay={0}>
            Галина <em>Кобан</em>
            <span className="sr-only"> — онлайн-курси манікюру та педикюру Koban Nails</span>
          </MotionHeroLine>
          <MotionHeroLine className="hero-line landing-lead landing-lead-full" delay={0.08}>
            Галина Кобан — інструктор базових онлайн та офлайн курсів з манікюру та педикюру, та
            підвищення кваліфікації майстрів, топ-майстер, спікер б&apos;юті-марафонів, помічник
            судді чемпіонату та багаторазова призерка чемпіонату України
          </MotionHeroLine>
          <MotionHeroLine className="hero-line landing-lead landing-lead-short" delay={0.08}>
            Інструктор курсів з манікюру та педикюру. Топ-майстер і спікер б&apos;юті-марафонів.
          </MotionHeroLine>
          <MotionHeroLine className="hero-line landing-hero-meta mobile-only" delay={0.12} aria-hidden="true">
            <span>Онлайн</span> · <span>Сертифікат</span> · <span>Підтримка</span>
          </MotionHeroLine>
          <MotionHeroLine className="hero-line landing-hero-actions" delay={0.16}>
            <SmoothAnchor id="courses" className="landing-btn landing-btn-sell">
              Обрати курс
              <IconArrowRight />
            </SmoothAnchor>
            <SmoothAnchor id="faq" className="landing-btn landing-btn-ghost landing-hero-consult">
              Питання перед купівлею
            </SmoothAnchor>
          </MotionHeroLine>
          <MotionHeroLine className="hero-line landing-hero-proof" delay={0.22} aria-label="Переваги та довіра">
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
          </MotionHeroLine>
          <MotionHeroLine className="hero-line landing-hero-strip" delay={0.28} aria-label="Формати навчання">
            <div><strong>Online</strong><span>доступ до уроків у власному темпі</span></div>
            <div><strong>Сертифікат</strong><span>з вашим ім&apos;ям після завершення</span></div>
          </MotionHeroLine>
        </div>
      </div>
    </section>
  );
}
