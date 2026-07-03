"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/lib/types";
import {
  IconBook,
  IconClose,
  IconDashboard,
  IconMenu,
  IconUsers,
} from "@/components/icons";

const links = [
  { href: "/admin", label: "Огляд", icon: IconDashboard },
  { href: "/admin/courses", label: "Курси", icon: IconBook },
  { href: "/admin/users", label: "Учні", icon: IconUsers },
];

export function AdminShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className={`glass fixed inset-y-0 left-0 z-50 w-[260px] transform p-5 transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="eyebrow">Koban nails</p>
            <h1 className="font-[family-name:var(--font-playfair)] text-xl">Адмін-панель</h1>
          </div>
          <button type="button" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Закрити меню">
            <IconClose />
          </button>
        </div>

        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-lg border border-line bg-black/30 p-3 text-xs text-muted">
          <p className="text-cream">{profile.full_name ?? profile.email}</p>
          <p className="mt-1">{profile.email}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/" className="btn btn-ghost min-h-9 px-3 text-xs">Сайт</Link>
            <Link href="/cabinet" className="btn btn-ghost min-h-9 px-3 text-xs">Кабінет</Link>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Закрити меню"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line/60 bg-black/70 px-4 backdrop-blur-xl lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Відкрити меню">
            <IconMenu />
          </button>
          <span className="text-sm font-medium">Адмін-панель</span>
        </div>
        <main className="shell py-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
