"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import NotificacaoBell from "./NotificacaoBell";

export default function Navbar() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

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
        <Link href="/" className="flex flex-col leading-none shrink-0" onClick={close}>
          <span className="font-serif text-[22px] font-bold text-ink tracking-tight">
            Bela &amp; Belo
          </span>
          <span className="hidden sm:block text-[10px] text-muted font-light tracking-widest uppercase mt-0.5">
            barba, cabelo e unha
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          {(!session || session.user.role === "client") && (
            <Link
              href="/parceiros"
              className="text-muted hover:text-ink transition-colors duration-200 font-light"
            >
              Registar o meu negócio
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
              {session.user.role !== "admin" && (
                <span className="text-muted text-sm font-light">
                  {session.user.name?.split(" ")[0]}
                </span>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="border border-[#ebebeb] text-muted px-4 py-1.5 rounded-pill text-xs
                           hover:border-ink hover:text-ink transition-all duration-200"
              >
                Sair
              </button>
            </div>
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
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-3">
          {session?.user.role === "owner" && <NotificacaoBell />}

          {session && (
            <span className="text-muted text-sm font-light">
              {session.user.name?.split(" ")[0]}
            </span>
          )}

          {!session && (
            <Link
              href="/login"
              className="border border-ink text-ink px-4 py-1.5 rounded-pill text-sm font-medium
                         hover:bg-ink hover:text-white transition-all duration-200"
            >
              Entrar
            </Link>
          )}

          <button
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            className="p-1.5 text-ink"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="3" x2="17" y2="17" />
                <line x1="17" y1="3" x2="3" y2="17" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect y="3"    width="20" height="1.5" rx="0.75" />
                <rect y="9.25" width="20" height="1.5" rx="0.75" />
                <rect y="15.5" width="20" height="1.5" rx="0.75" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-[#ebebeb] bg-white px-6 py-5 flex flex-col gap-5">
          {(!session || session.user.role === "client") && (
            <Link
              href="/parceiros"
              onClick={close}
              className="text-sm text-ink font-light"
            >
              Registar o meu negócio
            </Link>
          )}

          {session?.user.role === "client" && (
            <Link href="/minha-conta" onClick={close} className="text-sm text-ink font-light">
              Minha conta
            </Link>
          )}

          {session?.user.role === "owner" && (
            <Link href="/painel" onClick={close} className="text-sm text-ink font-light">
              Painel
            </Link>
          )}

          {session?.user.role === "admin" && (
            <Link href="/admin" onClick={close} className="text-sm text-ink font-light">
              Admin
            </Link>
          )}

          {session && (
            <button
              onClick={() => { signOut({ callbackUrl: "/" }); close(); }}
              className="text-sm text-muted font-light text-left"
            >
              Sair
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
