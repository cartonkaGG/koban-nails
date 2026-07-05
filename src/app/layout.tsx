import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthModalProvider } from "@/components/auth/auth-modal-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Галина Кобан | Курси манікюру",
  description:
    "Онлайн-курси манікюру від нуля до першого клієнта. Навчання, кабінет учня та підтримка наставника.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <AuthModalProvider>{children}</AuthModalProvider>
      </body>
    </html>
  );
}
