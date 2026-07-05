"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function CabinetShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onCoursePage = pathname.startsWith("/cabinet/courses/");

  async function logout() {
    if (isSupabaseConfigured()) {
      const { createClient } = await import("@/lib/supabase/client");
      await createClient().auth.signOut();
    } else {
      await fetch("/api/demo-login", { method: "DELETE" });
    }
    window.location.href = "/";
  }

  return (
    <div className="cabinet-layout min-h-dvh">
      <header className="cabinet-header">
        <div className="shell cabinet-header-inner">
          <div className="flex min-w-0 items-center gap-4">
            {onCoursePage ? (
              <Link href="/cabinet" className="cabinet-back-link">
                ← Курси
              </Link>
            ) : (
              <Link href="/" className="cabinet-brand">
                Koban <span>nails</span>
              </Link>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[140px] truncate text-sm text-cream-body sm:block">
              {profile.full_name?.split(" ")[0] ?? profile.email}
            </span>
            {profile.role === "admin" && (
              <Link href="/admin" className="cabinet-header-btn hidden sm:inline-flex">
                Адмін
              </Link>
            )}
            <Link href="/cabinet/profile" className="cabinet-header-btn">
              Профіль
            </Link>
            <button type="button" className="cabinet-header-btn" onClick={logout}>
              Вийти
            </button>
          </div>
        </div>
      </header>

      <main className="shell cabinet-main">{children}</main>
    </div>
  );
}
