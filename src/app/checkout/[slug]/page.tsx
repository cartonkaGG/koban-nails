import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { SiteHeader } from "@/components/site-header";
import { getProfile } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const profile = await getProfile();
  if (!profile) {
    redirect(`/?auth=login&next=${encodeURIComponent(`/checkout/${slug}`)}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="shell py-10 sm:py-16">
        <div className="mx-auto max-w-xl">
          <Link href="/#courses" className="text-sm text-muted hover:text-gold">← До курсів</Link>
          <div className="mt-4">
            <CheckoutForm course={course} />
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            <Link href="/terms" className="hover:text-gold">Умови</Link>
            {" · "}
            <Link href="/privacy" className="hover:text-gold">Конфіденційність</Link>
          </p>
        </div>
      </main>
    </>
  );
}
