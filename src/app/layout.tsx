import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";

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

export const metadata: Metadata = {
  title: "Bela & Belo — barba, cabelo e unha · Cabo Verde",
  description: "Agende o seu horário nas melhores barbearias e salões de Cabo Verde",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans bg-white text-ink antialiased">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
