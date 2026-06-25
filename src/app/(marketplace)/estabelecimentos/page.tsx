"use client";
import { useState } from "react";
import VenueListWithGeo from "@/components/VenueListWithGeo";

const CATEGORIES = [
  { id: "barbearia", label: "Barbearia",                  symbol: "✂" },
  { id: "salao",     label: "Cabeleireiro & Penteados",   symbol: "✿" },
  { id: "spa",       label: "Unhas & Maquilhagem",        symbol: "◈" },
];

export default function EstabelecimentosPage() {
  const [draft, setDraft]           = useState("");
  const [active, setActive]         = useState("");
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);

  function toggleCategory(id: string) {
    setActiveCategory((prev) => (prev === id ? undefined : id));
  }

  return (
    <main className="max-w-content mx-auto px-6 py-16">
      <h1 className="font-serif text-4xl font-bold text-ink mb-2">
        Estabelecimentos
      </h1>
      <p className="text-muted font-light text-sm mb-8">
        Encontre barbearias, cabeleireiros e salões de beleza em Cabo Verde.
      </p>

      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); setActive(draft); }}
        className="flex gap-3 mb-6"
      >
        <input
          aria-label="Pesquisar estabelecimentos"
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

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => toggleCategory(cat.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-medium border transition-all duration-200 ${
              activeCategory === cat.id
                ? "bg-ink text-white border-ink"
                : "border-[#ebebeb] text-muted hover:border-ink hover:text-ink"
            }`}
          >
            <span>{cat.symbol}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <VenueListWithGeo searchQuery={active} activeCategory={activeCategory} />
    </main>
  );
}
