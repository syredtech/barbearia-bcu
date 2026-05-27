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
      <section className="max-w-content mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-16 sm:pb-24">
        <div className="max-w-[720px] mb-7 sm:mb-10">
          <h1 className="hero-title font-serif font-bold text-ink fade-up">
            Agende com<br />
            simplicidade.
          </h1>
          <p className="mt-7 text-muted text-lg font-light max-w-[440px] fade-up-1">
            Os melhores profissionais de Cabo Verde, ao alcance de um toque.
          </p>
        </div>

        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); setActive(draft); }}
          className="flex gap-3 mb-10 fade-up-2"
        >
          <input
            value={draft}
            onChange={(e) => { setDraft(e.target.value); if (!e.target.value) setActive(""); }}
            placeholder="Buscar por nome, endereço, ilha…"
            className="flex-1 border border-[#ebebeb] rounded-pill px-5 py-3 text-sm font-light
                       focus:outline-none focus:border-ink transition-colors duration-200 bg-white"
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

        {!timeSearchOn && <VenueListWithGeo searchQuery={active} showCategoryFilter />}
      </section>
    </main>
  );
}
