"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/lib/types";
import { IconBook, IconUser } from "@/components/icons";

const links = [
  { href: "/cabinet", label: "Мої курси", icon: IconBook },
  { href: "/cabinet/profile", label: "Профіль", icon: IconUser },
];

export function CabinetShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line/60 bg-black/70 backdrop-blur-xl">
        <div className="shell flex h-[68px] items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Особистий кабінет</p>
            <h1 className="font-[family-name:var(--font-playfair)] text-xl">
              Вітаємо, {profile.full_name?.split(" ")[0] ?? "учениця"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {profile.role === "admin" && (
              <Link href="/admin" className="btn btn-ghost hidden sm:inline-flex">Адмін</Link>
            )}
            <Link href="/" className="btn btn-ghost">На сайт</Link>
          </div>
        </div>
        <div className="shell pb-4">
          <nav className="flex gap-2 overflow-x-auto">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
                    active ? "bg-gold/10 text-gold" : "text-cream-body hover:bg-white/5 hover:text-cream"
                  }`}
                >
                  <Icon />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="shell py-6 sm:py-8">{children}</main>
    </div>
  );
}
