import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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

const SITE_URL = (process.env.NEXTAUTH_URL ?? "https://belabelo.cv").replace(/\/$/, "");

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
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Bela & Belo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bela & Belo — Barba, Cabelo e Unha · Cabo Verde",
    description: "Agende o seu horário nas melhores barbearias, salões e spas de Cabo Verde.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans bg-white text-ink antialiased">
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
