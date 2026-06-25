"use client";
import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="max-w-content mx-auto px-6 py-24 text-center">
      <p className="font-serif text-8xl font-bold text-ink opacity-10 mb-6 select-none">!</p>
      <h1 className="font-serif text-3xl font-bold text-ink mb-3">
        Algo correu mal.
      </h1>
      <p className="text-muted text-sm font-light mb-10 max-w-sm mx-auto">
        Ocorreu um erro inesperado. Tente novamente ou volte ao início.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={reset}
          className="bg-ink text-white px-7 py-3 rounded-pill text-sm font-medium
                     hover:bg-[#333] transition-all duration-200"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="border border-[#ebebeb] text-ink px-7 py-3 rounded-pill text-sm font-light
                     hover:border-[#bbb] transition-all duration-200"
        >
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
