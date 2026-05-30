import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#ebebeb] mt-16 sm:mt-24">
      <div className="max-w-content mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <span className="font-serif font-bold text-ink text-sm">Bela &amp; Belo</span>
          <span className="text-muted text-xs ml-2">— Barba, Cabelo e Unha</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted">
          <Link href="/estabelecimentos" className="hover:text-ink transition-colors duration-200">
            Estabelecimentos
          </Link>
          <Link href="/parceiros" className="hover:text-ink transition-colors duration-200">
            Registe o seu negócio
          </Link>
          <a href="mailto:suporte@bcu.cv" className="hover:text-ink transition-colors duration-200">
            Suporte
          </a>
        </nav>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Bela &amp; Belo</p>
      </div>
    </footer>
  );
}
