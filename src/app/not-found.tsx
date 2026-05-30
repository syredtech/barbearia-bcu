import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="max-w-content mx-auto px-6 py-24 text-center">
      <p className="font-serif text-8xl font-bold text-ink opacity-10 mb-6 select-none">404</p>
      <h1 className="font-serif text-3xl font-bold text-ink mb-3">
        Página não encontrada.
      </h1>
      <p className="text-muted text-sm font-light mb-10 max-w-sm mx-auto">
        O endereço que procura não existe ou foi removido.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="bg-ink text-white px-7 py-3 rounded-pill text-sm font-medium
                     hover:bg-[#333] transition-all duration-200"
        >
          Ir para o início
        </Link>
        <Link
          href="/estabelecimentos"
          className="border border-[#ebebeb] text-ink px-7 py-3 rounded-pill text-sm font-light
                     hover:border-[#bbb] transition-all duration-200"
        >
          Ver estabelecimentos
        </Link>
      </div>
    </main>
  );
}
