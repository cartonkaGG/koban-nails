import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { SiteHeader } from "@/components/site-header";
import { getCourseBySlug } from "@/lib/data";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  return (
    <>
      <SiteHeader />
      <main className="shell py-10 sm:py-16">
        <div className="mx-auto max-w-xl">
          <Link href="/#courses" className="text-sm text-muted hover:text-gold">← До курсів</Link>
          <div className="mt-4">
            <CheckoutForm course={course} />
          </div>
        </div>
      </main>
    </>
  );
}
