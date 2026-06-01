import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["700", "800"],
  display: "swap",
});

const SITE_URL = "https://barbearia-bcu.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bela & Belo — Barba, Cabelo e Unha · Cabo Verde",
    template: "%s · Bela & Belo",
  },
  description:
    "Agende o seu horário nas melhores barbearias, salões de beleza e spas de Cabo Verde. Simples, rápido e sem complicações.",
  keywords: ["barbearia", "salão de beleza", "spa", "agendamento", "Cabo Verde", "barba", "cabelo", "unha"],
  openGraph: {
    type: "website",
    locale: "pt_CV",
    url: SITE_URL,
    siteName: "Bela & Belo",
    title: "Bela & Belo — Barba, Cabelo e Unha · Cabo Verde",
    description:
      "Agende o seu horário nas melhores barbearias, salões e spas de Cabo Verde.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bela & Belo — Barba, Cabelo e Unha · Cabo Verde",
    description: "Agende o seu horário nas melhores barbearias, salões e spas de Cabo Verde.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${dmSans.variable} ${playfair.variable}`}>
      <head>
        <link rel="preload" as="image" href="/hero/hero-1.webp" />
      </head>
      <body className="font-sans bg-white text-ink antialiased">
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
