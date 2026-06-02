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
      <div className="bg-[#f7f4f0] relative overflow-hidden min-h-[100svh] lg:min-h-[540px] flex flex-col lg:block">
        <HeroSlideshow />

        <section className="flex-1 lg:flex-none w-full max-w-content mx-auto px-4 sm:px-6 pt-12 sm:pt-16 lg:pt-24 pb-8 lg:pb-10 relative z-20 flex flex-col lg:block">

          {/* Title — vertically centered in available height on mobile */}
          <div className="flex-1 lg:flex-none flex items-center lg:block mb-8 lg:mb-9">
            <div className="max-w-[720px] w-full relative">
              <h1 className="hero-title font-serif font-bold text-black fade-up">
                Agende com<br />
                simplicidade.
              </h1>
              {/* Subtítulo desktop */}
              <p className="mt-4 text-2xl font-serif font-semibold max-w-[480px] fade-up-1 hidden lg:block"
                style={{
                  color: "rgba(255,255,255,1)",
                  textShadow: "-0.7px -0.7px 0 rgba(0,0,0,0.9), 0.7px -0.7px 0 rgba(0,0,0,0.9), -0.7px 0.7px 0 rgba(0,0,0,0.9), 0.7px 0.7px 0 rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.45), 0 2px 18px rgba(0,0,0,0.3)",
                }}>
                A forma mais fácil de marcar o seu corte, penteado ou maquilhagem.<br />
                Escolha a hora e reserve já. <span className="whitespace-nowrap">Rápido e gratuito!</span>
              </p>
              {/* Subtítulo mobile */}
              <p className="mt-7 text-xl font-light max-w-[320px] fade-up-1 lg:hidden"
                style={{
                  color: "rgba(247,244,240,0.95)",
                  textShadow: "-0.7px -0.7px 0 rgba(0,0,0,0.9), 0.7px -0.7px 0 rgba(0,0,0,0.9), -0.7px 0.7px 0 rgba(0,0,0,0.9), 0.7px 0.7px 0 rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.4), 0 2px 16px rgba(0,0,0,0.25)",
                }}>
                A forma mais fácil de marcar o seu corte, penteado ou maquilhagem.{" "}
                Escolha a hora e reserve já.<br />
                <span className="font-semibold whitespace-nowrap" style={{ color: "rgba(255,255,255,1)" }}>Rápido e gratuito!</span>
              </p>
            </div>
          </div>

          {/* Search + category pills (mobile) + TimeSearch */}
          <div className="pb-4">
            <form
              onSubmit={(e) => { e.preventDefault(); setActive(draft); }}
              className="flex gap-3 mb-4 fade-up-2 rounded-pill backdrop-blur-sm bg-white/10"
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
              <div className="grid grid-cols-4 gap-2 mb-4 lg:hidden">
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

        </section>

        {/* Scroll hint — mobile only, absolutely positioned so it's always visible */}
        {!timeSearchOn && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 lg:hidden pointer-events-none">
            <svg
              className="w-7 h-7 animate-bounce"
              fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="1.5" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
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
