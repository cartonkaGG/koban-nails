import Link from "next/link";
import { LandingTopbar } from "@/components/landing/topbar";

export const metadata = {
  title: "Умови використання | Koban nails",
  description: "Умови використання сайту та політика повернення коштів для онлайн-курсів Koban nails.",
};

export default function TermsPage() {
  return (
    <>
      <LandingTopbar />
      <main className="shell py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-sm text-muted hover:text-gold">
            ← На головну
          </Link>

          <div className="mt-6 space-y-8">
            <div>
              <p className="eyebrow">політика сайту</p>
              <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
                Умови використання
              </h1>
            </div>

            <section className="card space-y-3 text-sm leading-relaxed text-cream-body">
              <h2 className="font-medium text-cream">1. Загальні положення</h2>
              <p>
                Цей сайт належить Koban nails (Галина Кобан) і надає доступ до онлайн-курсів з
                манікюру. Користуючись сайтом або оформлюючи покупку, ви погоджуєтесь з цими
                умовами.
              </p>
            </section>

            <section className="card space-y-3 text-sm leading-relaxed text-cream-body">
              <h2 className="font-medium text-cream">2. Погодження з умовами при покупці</h2>
              <p>
                Оформлюючи замовлення та підтверджуючи оплату курсу, клієнт автоматично
                погоджується з усіма умовами використання сайту, описаними на цій сторінці.
                Оплата є підтвердженням згоди з правилами надання послуг.
              </p>
            </section>

            <section className="card space-y-3 text-sm leading-relaxed text-cream-body">
              <h2 className="font-medium text-cream">3. Цифрові продукти та повернення коштів</h2>
              <p>
                Усі курси на сайті є цифровими продуктами — після оплати клієнт отримує доступ до
                навчальних матеріалів у особистому кабінеті.
              </p>
              <p>
                Згідно з чинним законодавством України, цифровий контент, доступ до якого надано
                одразу після оплати, поверненню не підлягає. Після відкриття доступу до курсу
                повернення коштів не здійснюється.
              </p>
            </section>

            <section className="card space-y-3 text-sm leading-relaxed text-cream-body">
              <h2 className="font-medium text-cream">4. Доступ до курсу</h2>
              <p>
                Доступ до матеріалів надається після підтвердження оплати. Термін доступу залежить
                від обраної програми та вказаний на сторінці курсу.
              </p>
            </section>

            <section className="card space-y-3 text-sm leading-relaxed text-cream-body">
              <h2 className="font-medium text-cream">5. Контакти</h2>
              <p>
                З питань щодо курсів або умов використання звертайтесь через особистий кабінет після
                реєстрації або за контактами, вказаними при оформленні замовлення.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-line/60 py-8">
        <div className="shell text-sm text-muted">
          <p>Koban nails © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </>
  );
}
