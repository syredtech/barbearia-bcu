"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import NotificacaoBell from "./NotificacaoBell";

export default function Navbar() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-[#ebebeb]"
          : "bg-white border-b border-[#ebebeb]"
      }`}
    >
      <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-serif text-[22px] font-bold text-ink tracking-tight">
            Bela &amp; Belo
          </span>
          <span className="text-[10px] text-muted font-light tracking-widest uppercase mt-0.5">
            barba, cabelo e unha
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-8 text-sm">
          <Link
            href="/estabelecimentos"
            className="text-muted hover:text-ink transition-colors duration-200 font-light"
          >
            Estabelecimentos
          </Link>

          {(!session || session.user.role === "client") && (
            <Link
              href="/parceiros"
              className="text-muted hover:text-ink transition-colors duration-200 font-light"
            >
              Registar o meu negócio
            </Link>
          )}

          {!session && (
            <Link
              href="/login"
              className="border border-ink text-ink px-5 py-2 rounded-pill text-sm font-medium
                         hover:bg-ink hover:text-white transition-all duration-200"
            >
              Entrar
            </Link>
          )}

          {session?.user.role === "client" && (
            <Link
              href="/minha-conta"
              className="text-muted hover:text-ink transition-colors duration-200 font-light"
            >
              Minha conta
            </Link>
          )}

          {session?.user.role === "owner" && (
            <Link
              href="/painel"
              className="text-muted hover:text-ink transition-colors duration-200 font-light"
            >
              Painel
            </Link>
          )}

          {session?.user.role === "admin" && (
            <Link
              href="/admin"
              className="text-muted hover:text-ink transition-colors duration-200 font-light"
            >
              Admin
            </Link>
          )}

          {session && (
            <div className="flex items-center gap-3">
              {session.user.role === "owner" && <NotificacaoBell />}
              <span className="text-muted text-sm font-light">
                {session.user.name?.split(" ")[0]}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="border border-[#ebebeb] text-muted px-4 py-1.5 rounded-pill text-xs
                           hover:border-ink hover:text-ink transition-all duration-200"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
