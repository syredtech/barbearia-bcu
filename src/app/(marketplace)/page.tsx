"use client";
import { useState } from "react";
import VenueListWithGeo from "@/components/VenueListWithGeo";
import TimeSearch from "@/components/TimeSearch";
import HeroSlideshow from "@/components/HeroSlideshow";

const CATEGORIES = [
  { id: "",           label: "Todos",     symbol: "✦" },
  { id: "barbearia",  label: "Barbearia", symbol: "✂" },
  { id: "salao",      label: "Salão",     symbol: "✿" },
  { id: "spa",        label: "Spa",       symbol: "◈" },
];

export default function Home() {
  const [draft, setDraft]               = useState("");
  const [active, setActive]             = useState("");
  const [timeSearchOn, setTimeSearchOn] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");

  return (
    <main>
      {/* Hero — full viewport height on mobile */}
      <div className="bg-[#f7f4f0] relative overflow-hidden min-h-[100svh] lg:min-h-0 flex flex-col lg:block">
        <HeroSlideshow />

        <section className="flex-1 lg:flex-none w-full max-w-content mx-auto px-4 sm:px-6 pt-12 sm:pt-16 relative z-20 flex flex-col lg:block">

          {/* Title — vertically centered in available height on mobile */}
          <div className="flex-1 lg:flex-none flex items-center lg:block lg:mb-9">
            <div className="max-w-[720px] w-full relative">
              <h1 className="hero-title font-serif font-bold text-black fade-up">
                Agende com<br />
                simplicidade.
              </h1>
              {/* Subtítulo desktop */}
              <p className="mt-4 text-muted text-lg font-light max-w-[440px] fade-up-1 hero-sub hidden lg:block">
                Os melhores profissionais de Cabo Verde, ao alcance de um toque.
              </p>
              {/* Subtítulo mobile */}
              <p className="mt-4 text-muted text-lg font-light max-w-[320px] fade-up-1 hero-sub lg:hidden">
                A forma mais fácil de marcar o seu corte, penteado ou maquilhagem.{" "}
                Escolha a hora e reserve já.{" "}
                <span className="font-medium">Rápido e gratuito!</span>
              </p>
            </div>
          </div>

          {/* Search + category pills (mobile) + TimeSearch */}
          <div className="pb-3">
            <form
              onSubmit={(e) => { e.preventDefault(); setActive(draft); }}
              className="flex gap-3 mb-3 fade-up-2 rounded-pill backdrop-blur-sm bg-white/10"
            >
              <input
                aria-label="Pesquisar estabelecimentos"
                value={draft}
                onChange={(e) => { setDraft(e.target.value); if (!e.target.value) setActive(""); }}
                placeholder="Buscar por nome, endereço, ilha…"
                className="flex-1 border border-[#e0dbd4] rounded-pill px-5 py-3 text-sm font-light
                           focus:outline-none focus:border-ink transition-colors duration-200 bg-white/80"
              />
              <button
                type="submit"
                className="bg-ink text-white px-6 py-3 rounded-pill text-sm font-medium
                           hover:bg-[#333] transition-all duration-200"
              >
                Buscar
              </button>
            </form>

            {/* Category pills — mobile only, between search and TimeSearch */}
            {!timeSearchOn && (
              <div className="grid grid-cols-4 gap-2 mb-3 lg:hidden">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center justify-center gap-1 px-1 py-2 rounded-pill text-xs font-medium
                      backdrop-blur-sm transition-all duration-200 ${
                        activeCategory === cat.id
                          ? "bg-ink text-white border border-ink"
                          : "bg-white/20 border border-white/40 text-white hover:bg-white/35"
                      }`}
                  >
                    <span className="text-[13px] leading-none">{cat.symbol}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            <TimeSearch onActiveChange={setTimeSearchOn} />
          </div>

          {/* Scroll hint — mobile only */}
          {!timeSearchOn && (
            <div className="flex justify-center pb-5 pt-1 lg:hidden pointer-events-none">
              <svg
                className="w-5 h-5 animate-bounce"
                fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}

        </section>
      </div>

      {/* Gradient transition warm → white */}
      {!timeSearchOn && <div className="h-8 bg-gradient-to-b from-[#f7f4f0] to-white" />}

      {/* Listing */}
      {!timeSearchOn && (
        <section className="max-w-content mx-auto px-4 sm:px-6 pt-2 pb-12 sm:pb-16">
          <h2 className="sr-only">Estabelecimentos</h2>

          {/* Category pills — desktop only */}
          <div className="hidden lg:grid grid-cols-4 gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-pill text-sm font-medium
                  transition-all duration-200 ${
                    activeCategory === cat.id
                      ? "bg-ink text-white"
                      : "border border-[#e0dbd4] text-muted hover:border-ink hover:text-ink"
                  }`}
              >
                <span className="text-[15px] leading-none">{cat.symbol}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <VenueListWithGeo searchQuery={active} activeCategory={activeCategory} />
        </section>
      )}
    </main>
  );
}
