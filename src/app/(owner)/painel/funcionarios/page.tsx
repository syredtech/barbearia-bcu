"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Funcionario { id: string; name: string }

export default function FuncionariosPage() {
  const router = useRouter();
  const [list, setList]       = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError]     = useState("");

  async function load() {
    const res = await fetch("/api/owner/funcionarios");
    if (res.ok) setList(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!draft.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/owner/funcionarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.trim() }),
    });
    setSaving(false);
    if (res.ok) { setDraft(""); load(); }
    else { const d = await res.json(); setError(d.error || "Erro ao adicionar."); }
  }

  async function remove(id: string) {
    setRemovingId(id);
    setError("");
    const res = await fetch(`/api/owner/funcionarios/${id}`, { method: "DELETE" });
    setRemovingId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erro ao remover funcionário.");
    }
    load();
  }

  const capacity = Math.max(1, list.length);

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

      <div className="max-w-[480px]">
        <p className="text-xs text-muted uppercase tracking-widest mb-2">Configuração</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-2">
          Funcionários
        </h1>
        <p className="text-muted text-sm font-light mb-8">
          Cada funcionário permite um agendamento simultâneo adicional.
          {" "}Capacidade atual: <strong className="text-ink">{capacity}</strong> cliente{capacity !== 1 ? "s" : ""} em simultâneo.
        </p>

        {/* Add form */}
        <div className="border border-[#ebebeb] rounded-card p-5 mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted mb-4">
            Adicionar funcionário
          </p>
          <div className="flex gap-3">
            <input
              aria-label="Nome do funcionário"
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
              placeholder="Nome do funcionário"
              className="flex-1 border border-[#ebebeb] rounded-card px-4 py-2.5 text-sm font-light
                         focus:outline-none focus:border-ink transition-colors"
            />
            <button
              onClick={add}
              disabled={saving || !draft.trim()}
              className="bg-ink text-white px-5 py-2.5 rounded-card text-sm font-medium
                         hover:bg-[#333] transition-all duration-200 disabled:opacity-40 shrink-0"
            >
              {saving ? "…" : "Adicionar"}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-[#f5f5f5] rounded-card animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="border border-dashed border-[#e4e4e4] rounded-card p-8 text-center">
            <p className="text-muted text-sm font-light">
              Nenhum funcionário adicionado.<br />
              Sem funcionários, o estabelecimento aceita 1 agendamento por horário.
            </p>
          </div>
        ) : (
          <div className="border border-[#ebebeb] rounded-card overflow-hidden">
            {list.map((f, i) => (
              <div
                key={f.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  i < list.length - 1 ? "border-b border-[#ebebeb]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shrink-0">
                    <span className="text-white text-[11px] font-serif font-bold">
                      {f.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-ink">{f.name}</span>
                </div>
                <button
                  onClick={() => remove(f.id)}
                  disabled={removingId === f.id}
                  className="text-xs text-muted hover:text-red-600 transition-colors disabled:opacity-40"
                >
                  {removingId === f.id ? "…" : "Remover"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
