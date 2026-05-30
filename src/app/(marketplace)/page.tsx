"use client";
import { useState } from "react";
import VenueListWithGeo from "@/components/VenueListWithGeo";
import TimeSearch from "@/components/TimeSearch";

export default function Home() {
  const [draft, setDraft]         = useState("");
  const [active, setActive]       = useState("");
  const [timeSearchOn, setTimeSearchOn] = useState(false);

  return (
    <main>
      {/* Hero — warm background */}
      <div className="bg-[#f7f4f0]">
        <section className="max-w-content mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-5 sm:pb-7 relative overflow-hidden">
          {/* decorative watermark */}
          <span
            className="pointer-events-none select-none absolute right-0 top-[-1rem] font-serif font-bold leading-none hidden lg:block"
            style={{ fontSize: "260px", color: "rgba(26,26,26,0.04)" }}
            aria-hidden="true"
          >
            &amp;
          </span>

          <div className="max-w-[720px] mb-5 sm:mb-7 relative">
            <h1 className="hero-title font-serif font-bold text-ink fade-up">
              Agende com<br />
              simplicidade.
            </h1>
            <p className="mt-4 text-muted text-lg font-light max-w-[440px] fade-up-1">
              Os melhores profissionais de Cabo Verde, ao alcance de um toque.
            </p>
          </div>

          {/* Search */}
          <form
            onSubmit={(e) => { e.preventDefault(); setActive(draft); }}
            className="flex gap-3 mb-6 fade-up-2"
          >
            <input
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

          <TimeSearch onActiveChange={setTimeSearchOn} />
        </section>
      </div>

      {/* Listing */}
      {!timeSearchOn && (
        <section className="max-w-content mx-auto px-4 sm:px-6 pt-4 pb-12 sm:pb-16">
          <h2 className="sr-only">Estabelecimentos</h2>
          <VenueListWithGeo searchQuery={active} showCategoryFilter />
        </section>
      )}
    </main>
  );
}
