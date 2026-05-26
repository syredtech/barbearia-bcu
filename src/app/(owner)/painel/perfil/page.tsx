"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  const [imageUrl, setImageUrl]       = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress]         = useState("");
  const [phone, setPhone]             = useState("");

  useEffect(() => {
    fetch("/api/owner/venue")
      .then((r) => r.json())
      .then((d) => {
        if (d.imageUrl)     setImageUrl(d.imageUrl);
        if (d.description)  setDescription(d.description);
        if (d.address)      setAddress(d.address);
        if (d.phone)        setPhone(d.phone);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/owner/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, description, address, phone }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else setError("Erro ao guardar. Tenta novamente.");
  }

  if (loading) {
    return (
      <main className="max-w-content mx-auto px-6 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#f0f0f0] rounded w-48" />
          <div className="h-4 bg-[#f0f0f0] rounded w-64" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-content mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={() => router.push("/painel")}
          className="text-muted hover:text-ink transition-colors text-sm"
        >
          ← Painel
        </button>
      </div>

      <div className="max-w-[560px]">
        <p className="text-xs text-muted uppercase tracking-widest mb-2">Configuração</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-8">
          Perfil do estabelecimento
        </h1>

        <form onSubmit={save} className="space-y-4">
          <div className="border border-[#ebebeb] rounded-card p-6">
            <p className="text-xs font-medium uppercase tracking-widest text-muted mb-4">Imagem</p>
            <div>
              <label className="text-xs text-muted block mb-1.5">URL da foto de capa</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="w-full border border-[#ebebeb] rounded-card px-3 py-2.5 text-sm font-light
                           focus:outline-none focus:border-ink transition-colors"
              />
              {imageUrl && (
                <div className="mt-3 w-full aspect-[4/3] rounded-[8px] overflow-hidden bg-[#f5f5f5]">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="border border-[#ebebeb] rounded-card p-6">
            <p className="text-xs font-medium uppercase tracking-widest text-muted mb-4">Informações</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o seu estabelecimento…"
                  rows={3}
                  className="w-full border border-[#ebebeb] rounded-card px-3 py-2.5 text-sm font-light
                             focus:outline-none focus:border-ink transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Morada</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, cidade…"
                  className="w-full border border-[#ebebeb] rounded-card px-3 py-2.5 text-sm font-light
                             focus:outline-none focus:border-ink transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+238 …"
                  className="w-full border border-[#ebebeb] rounded-card px-3 py-2.5 text-sm font-light
                             focus:outline-none focus:border-ink transition-colors"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-ink text-white rounded-card py-3.5 text-sm font-medium
                       hover:bg-[#333] transition-all duration-200 disabled:opacity-40"
          >
            {saving ? "A guardar…" : saved ? "Guardado ✓" : "Guardar perfil"}
          </button>
        </form>
      </div>
    </main>
  );
}
