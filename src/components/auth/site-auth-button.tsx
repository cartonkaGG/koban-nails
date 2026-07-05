"use client";

import Link from "next/link";
import { AuthTrigger } from "./auth-trigger";

type Props = {
  className?: string;
  next?: string;
};

export function SiteAuthButton({ className = "btn btn-primary", next }: Props) {
  return (
    <AuthTrigger className={className} next={next}>
      Увійти
    </AuthTrigger>
  );
}

export function FooterAuthLink({ className = "hover:text-gold" }: { className?: string }) {
  return (
    <AuthTrigger className={`auth-text-link ${className}`}>
      Увійти
    </AuthTrigger>
  );
}

export function SiteAuthOrCabinet({
  profile,
}: {
  profile: { role: string } | null;
}) {
  if (profile) {
    return (
      <>
        {profile.role === "admin" && (
          <Link href="/admin" className="btn btn-ghost hidden sm:inline-flex">
            Адмін
          </Link>
        )}
        <Link href="/cabinet" className="btn btn-primary">
          Кабінет
        </Link>
      </>
    );
  }

  return <SiteAuthButton />;
}
