"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistance } from "@/lib/geo";

const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

interface VenueResult {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  address: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  _distance?: number;
  servicos: { id: string; price: number }[];
}

function VenueCard({ v }: { v: VenueResult }) {
  const minPrice = v.servicos.length > 0
    ? Math.min(...v.servicos.map((s) => s.price))
    : 0;

  const initials = v.name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
  const placeholderCfg: Record<string, { bg: string; accent: string }> = {
    barbearia: { bg: "linear-gradient(160deg, #1c1814 0%, #382d22 100%)", accent: "#b8860b" },
    salao:     { bg: "linear-gradient(160deg, #1c1622 0%, #362840 100%)", accent: "#c8a0b8" },
    spa:       { bg: "linear-gradient(160deg, #121e1c 0%, #1e3830 100%)", accent: "#6aaa96" },
  };
  const { bg, accent } = placeholderCfg[v.category] ?? { bg: "linear-gradient(160deg, #1a1a1a 0%, #303030 100%)", accent: "#888" };

  return (
    <Link href={`/estabelecimentos/${v.slug}`} className="group block cursor-pointer">
      <div className="w-full aspect-video rounded-[12px] overflow-hidden mb-3 bg-[#f5f5f5]">
        {v.imageUrl ? (
          <img
            src={v.imageUrl} alt={v.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 transition-transform duration-500 group-hover:scale-[1.04]"
            style={{ background: bg }}>
            <span className="font-serif font-bold select-none tracking-widest text-white/60 leading-none"
              style={{ fontSize: "clamp(44px, 5vw, 68px)" }}>
              {initials}
            </span>
            <div className="h-px w-8 rounded-full" style={{ background: accent, opacity: 0.8 }} />
          </div>
        )}
      </div>
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif font-bold text-ink text-[15px] leading-snug">{v.name}</h3>
          {v._distance !== undefined && (
            <span className="text-xs text-muted shrink-0 mt-0.5">{formatDistance(v._distance)}</span>
          )}
        </div>
        <p className="text-muted text-sm mt-0.5 leading-snug">{v.address ?? v.category}</p>
        {minPrice > 0 && (
          <p className="text-ink text-sm font-medium mt-1.5">
            A partir de {minPrice.toLocaleString("pt-CV")} ECV
          </p>
        )}
      </div>
    </Link>
  );
}

const CATEGORIES = [
  { id: "barbearia",  label: "Barbearia", symbol: "✂" },
  { id: "salao",      label: "Salão",     symbol: "✿" },
  { id: "spa",        label: "Spa",       symbol: "◈" },
];

export default function TimeSearch({ onActiveChange }: { onActiveChange?: (active: boolean) => void }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate]         = useState(today);
  const [time, setTime]         = useState("09:00");
  const [category, setCategory] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults]   = useState<VenueResult[] | null>(null);
  const [total, setTotal]       = useState(0);
  const [userLoc, setUserLoc]   = useState<{ lat: number; lng: number } | null>(null);
  const [open, setOpen]         = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { timeout: 10000, maximumAge: 300000 },
      );
    }
  }, []);

  async function search() {
    if (category === null) return;
    setSearching(true);
    setResults(null);
    const params = new URLSearchParams({ date, time });
    if (category) params.set("category", category);
    if (userLoc) { params.set("lat", String(userLoc.lat)); params.set("lng", String(userLoc.lng)); }
    const res  = await fetch(`/api/profissionais-disponiveis?${params}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setTotal(data.total ?? 0);
    setSearching(false);
    onActiveChange?.(true);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function reset() { setResults(null); setOpen(false); setCategory(null); onActiveChange?.(false); }

  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label ?? "";
  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("pt-CV", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="mb-3">
      {/* Toggle button */}
      {!open && results === null && (
        <button
          onClick={() => setOpen(true)}
          className="w-full border border-[#e0dbd4] bg-white/60 backdrop-blur-sm rounded-card px-5 py-4 text-left
                     text-sm text-muted hover:border-ink hover:text-ink hover:bg-white/80 transition-all duration-200 group"
        >
          <span className="flex items-center gap-3">
            <svg className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Diga o seu horário — encontramos o profissional disponível</span>
          </span>
        </button>
      )}

      {/* Expanded form */}
      {(open || results !== null) && (
        <div className="border border-[#ebebeb] rounded-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              Buscar por disponibilidade
            </p>
            <button onClick={reset} className="text-xs text-muted hover:text-ink transition-colors">
              ✕ Fechar
            </button>
          </div>

          {/* Category filter — required */}
          <div className="mb-4">
            <label className="text-xs text-muted block mb-2">
              Tipo de serviço
              {category === null && (
                <span className="ml-1.5 text-[#c0392b]">· obrigatório</span>
              )}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-card border text-xs font-medium
                    transition-all duration-200 ${
                      category === cat.id
                        ? "bg-ink text-white border-ink"
                        : "border-[#ebebeb] text-muted hover:border-ink hover:text-ink"
                    }`}
                >
                  <span className="text-[18px] leading-none">{cat.symbol}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + time */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted block mb-1">Data</label>
              <input
                type="date" min={today} value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-[#ebebeb] rounded-card px-3 py-2.5 text-sm font-light
                           focus:outline-none focus:border-ink transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Horário</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-[#ebebeb] rounded-card px-3 py-2.5 text-sm font-light
                           focus:outline-none focus:border-ink transition-colors"
              >
                {HALF_HOURS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={search}
            disabled={searching || category === null}
            className="w-full bg-ink text-white rounded-card py-3 text-sm font-medium
                       hover:bg-[#333] transition-all duration-200 disabled:opacity-40"
          >
            {searching ? "A procurar…" : "Encontrar profissional disponível"}
          </button>
        </div>
      )}

      {/* Results */}
      {results !== null && (
        <div ref={resultsRef} className="mt-6">
          {results.length === 0 ? (
            <div className="py-10 text-center border border-[#ebebeb] rounded-card">
              <p className="text-ink font-serif text-lg font-bold mb-1">Sem disponibilidade</p>
              <p className="text-muted text-sm font-light">
                Nenhum{categoryLabel ? ` ${categoryLabel.toLowerCase()}` : " profissional"} disponível
                às {time} de {dateLabel}.
              </p>
              <button
                onClick={() => setResults(null)}
                className="mt-4 text-xs text-muted underline underline-offset-2 hover:text-ink transition-colors"
              >
                Tentar outro horário
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted mb-5">
                {results.length === total
                  ? `${total} profissiona${total !== 1 ? "is" : "l"} disponíve${total !== 1 ? "is" : "l"}`
                  : `${results.length} mais próximos de ${total} disponíveis`}
                {categoryLabel ? ` · ${categoryLabel}` : ""}
                {" "}· {time} de {dateLabel}
                {userLoc ? " · por distância" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {results.map((v) => <VenueCard key={v.id} v={v} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
