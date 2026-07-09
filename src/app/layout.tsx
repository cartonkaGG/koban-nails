import type { Metadata } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond, Manrope } from "next/font/google";
import { AuthModalProvider } from "@/components/auth/auth-modal-context";
import { SupportChatLazy } from "@/components/support/support-chat-lazy";
import { rootMetadata } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
});

// New design fonts (v2 landing). Cormorant Garamond ships Latin only —
// Cyrillic headings gracefully fall back to Georgia, matching the design source.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${inter.variable} ${playfair.variable} ${cormorant.variable} ${manrope.variable}`}
    >
      <body>
        <AuthModalProvider>
          {children}
          <SupportChatLazy />
        </AuthModalProvider>
      </body>
    </html>
  );
}
