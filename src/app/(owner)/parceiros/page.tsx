"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface FormState {
  name: string; slug: string; category: string;
  description: string; address: string; phone: string;
  latitude: number | null; longitude: number | null;
}

export default function ParceirosPage() {
  const { status, update } = useSession();
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "", slug: "", category: "barbearia",
    description: "", address: "", phone: "",
    latitude: null, longitude: null,
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError]   = useState("");

  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: f.slug
        ? f.slug
        : value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
    setError("");
  }

  function captarLocalizacao() {
    if (!navigator.geolocation) { setGeoError("Geolocalização não suportada."); return; }
    setGeoLoading(true); setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude })); setGeoLoading(false); },
      () => { setGeoError("Não foi possível obter a localização. Verifique as permissões."); setGeoLoading(false); },
      { timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login?callbackUrl=/parceiros"); return; }
    setLoading(true);
    const res = await fetch("/api/owner/venue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) { await update(); router.push("/painel"); }
    else { const d = await res.json().catch(() => ({})); setError(d.error || "Erro ao cadastrar."); }
  }

  const inputClass = "w-full border border-[#ebebeb] rounded-card px-4 py-3 text-sm font-light focus:outline-none focus:border-ink transition-colors duration-200";
  const labelClass = "block text-xs text-muted uppercase tracking-widest mb-2";

  return (
    <main className="max-w-[560px] mx-auto px-6 py-16">
      <p className="text-xs text-muted uppercase tracking-widest mb-2">Parceiros</p>
      <h1 className="font-serif text-4xl font-bold text-ink mb-3">
        Cadastre o seu negócio.
      </h1>
      <p className="text-muted font-light text-sm mb-12 leading-relaxed">
        Após o registo, a nossa equipa revê e aprova o seu perfil. O seu estabelecimento
        passa a receber agendamentos online.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="parc-nome" className={labelClass}>Nome do estabelecimento</label>
          <input id="parc-nome" type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required maxLength={100} className={inputClass} />
        </div>

        <div>
          <label htmlFor="parc-slug" className={labelClass}>URL personalizada</label>
          <div className="flex items-stretch border border-[#ebebeb] rounded-card overflow-hidden focus-within:border-ink transition-colors duration-200">
            <span className="bg-[#fafafa] px-4 flex items-center text-muted text-sm border-r border-[#ebebeb] shrink-0">
              bcu.cv/
            </span>
            <input
              id="parc-slug"
              type="text" value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
              className="flex-1 px-4 py-3 text-sm font-light focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Categoria</label>
          <div className="flex gap-3">
            {[
              { id: "barbearia", label: "Barbearia" },
              { id: "salao",     label: "Cabeleireiro & Penteados" },
              { id: "spa",       label: "Unhas & Maquilhagem" },
            ].map(({ id, label }) => (
              <button
                key={id} type="button"
                onClick={() => setForm((f) => ({ ...f, category: id }))}
                className={`flex-1 border rounded-card py-3 text-sm transition-all duration-200
                  ${form.category === id ? "border-ink text-ink font-medium" : "border-[#ebebeb] text-muted hover:border-[#bbb]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="parc-desc" className={labelClass}>Descrição</label>
          <textarea id="parc-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3} maxLength={500} className={inputClass + " resize-none"} />
        </div>

        <div>
          <label htmlFor="parc-address" className={labelClass}>Endereço</label>
          <input id="parc-address" type="text" value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Ex: Rua de Lisboa, 12 — Plateau, Praia"
            maxLength={200} className={inputClass} />
        </div>

        <div>
          <label htmlFor="parc-phone" className={labelClass}>Telefone / WhatsApp</label>
          <input id="parc-phone" type="tel" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+238 9XX XX XX" maxLength={30} className={inputClass} />
        </div>

        {/* Geolocalização */}
        <div>
          <label className={labelClass}>Localização geográfica</label>
          <button
            type="button" onClick={captarLocalizacao} disabled={geoLoading}
            className="flex items-center gap-2.5 border border-[#ebebeb] rounded-pill px-5 py-2.5
                       text-sm font-light text-ink hover:border-ink transition-all duration-200 disabled:opacity-40"
          >
            {geoLoading ? (
              <span className="w-4 h-4 border-2 border-[#ebebeb] border-t-ink rounded-full animate-spin shrink-0" />
            ) : (
              <span className="text-base">📍</span>
            )}
            {geoLoading ? "A captar localização…" : "Captar localização atual"}
          </button>

          {geoError && <p className="mt-2 text-xs text-red-500">{geoError}</p>}

          {form.latitude !== null && form.longitude !== null && (
            <div className="mt-3 border border-[#ebebeb] rounded-card p-4">
              <p className="text-xs font-medium text-ink mb-1">Localização captada</p>
              <p className="text-xs text-muted font-light">
                {form.latitude.toFixed(5)}°N, {form.longitude.toFixed(5)}°
              </p>
              <a
                href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-muted underline underline-offset-2 mt-1.5 inline-block hover:text-ink transition-colors"
              >
                Verificar no Google Maps ↗
              </a>
            </div>
          )}

          {form.latitude === null && (
            <p className="mt-2 text-xs text-muted font-light">
              Necessário para ordenar por proximidade no marketplace.
            </p>
          )}
        </div>

        {error && <p className="text-red-500 text-sm font-light">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full bg-ink text-white rounded-pill py-3.5 text-sm font-medium
                     hover:bg-[#333] transition-all duration-200 disabled:opacity-40"
        >
          {loading ? "A cadastrar…" : "Cadastrar estabelecimento"}
        </button>
      </form>
    </main>
  );
}
