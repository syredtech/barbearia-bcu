"use client";
import { useState } from "react";
import VenueListWithGeo from "@/components/VenueListWithGeo";

export default function EstabelecimentosPage() {
  const [draft, setDraft]   = useState("");
  const [active, setActive] = useState("");

  return (
    <main className="max-w-content mx-auto px-6 py-16">
      <h1 className="font-serif text-4xl font-bold text-ink mb-8">
        Estabelecimentos
      </h1>

      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); setActive(draft); }}
        className="flex gap-3 mb-10"
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

      <VenueListWithGeo searchQuery={active} showCategoryFilter />
    </main>
  );
}
