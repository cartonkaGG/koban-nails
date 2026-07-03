import Link from "next/link";
import { getProfile } from "@/lib/auth";

export async function SiteHeader() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-black/75 backdrop-blur-xl">
      <div className="shell flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="font-[family-name:var(--font-playfair)] text-lg font-medium text-cream">
          Koban <span className="text-gold">nails</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-cream-body md:flex">
          <Link href="/#courses" className="transition-colors hover:text-gold">Курси</Link>
          <Link href="/#format" className="transition-colors hover:text-gold">Навчання</Link>
          <Link href="/#faq" className="transition-colors hover:text-gold">FAQ</Link>
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <>
              {profile.role === "admin" && (
                <Link href="/admin" className="btn btn-ghost hidden sm:inline-flex">Адмін</Link>
              )}
              <Link href="/cabinet" className="btn btn-primary">Кабінет</Link>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">Увійти</Link>
          )}
        </div>
      </div>
    </header>
  );
}
