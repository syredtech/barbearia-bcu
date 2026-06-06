"use client";
import { useEffect, useState } from "react";

interface Servico { id: string; name: string; description: string | null; duration: number; price: number }
const emptyForm = { name: "", description: "", duration: 30, price: 0 };
const inputClass = "w-full border border-[#ebebeb] rounded-card px-4 py-3 text-sm font-light focus:outline-none focus:border-ink transition-colors duration-200";

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function load() {
    const res = await fetch("/api/owner/servicos");
    if (!res.ok) return;
    const data = await res.json();
    setServicos(Array.isArray(data) ? data : []);
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = editId
      ? await fetch(`/api/owner/servicos/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/owner/servicos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erro ao guardar serviço.");
    } else {
      if (editId) setEditId(null);
      setForm(emptyForm);
    }
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este serviço?")) return;
    setError("");
    const res = await fetch(`/api/owner/servicos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erro ao remover serviço.");
    }
    load();
  }

  function startEdit(s: Servico) {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description || "", duration: s.duration, price: s.price });
  }

  return (
    <main className="max-w-content mx-auto px-6 py-16">
      <p className="text-xs text-muted uppercase tracking-widest mb-2">Painel</p>
      <h1 className="font-serif text-4xl font-bold text-ink mb-12">Serviços</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Form */}
        <div>
          <h2 className="font-serif text-xl font-bold text-ink mb-6">
            {editId ? "Editar serviço" : "Novo serviço"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="servico-nome" className="block text-xs text-muted uppercase tracking-widest mb-2">Nome</label>
              <input id="servico-nome" type="text" placeholder="Ex: Corte Masculino" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="servico-desc" className="block text-xs text-muted uppercase tracking-widest mb-2">Descrição</label>
              <input id="servico-desc" type="text" placeholder="Opcional" value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="servico-duracao" className="block text-xs text-muted uppercase tracking-widest mb-2">Duração (min)</label>
                <input id="servico-duracao" type="number" min={15} step={15} value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="servico-preco" className="block text-xs text-muted uppercase tracking-widest mb-2">Preço (ECV)</label>
                <input id="servico-preco" type="number" min={0} step={50} value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} required className={inputClass} />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm font-light">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="flex-1 bg-ink text-white rounded-pill py-3 text-sm font-medium hover:bg-[#333] transition-all duration-200 disabled:opacity-40">
                {loading ? "A guardar…" : editId ? "Guardar" : "Adicionar"}
              </button>
              {editId && (
                <button type="button" onClick={() => { setEditId(null); setForm(emptyForm); }}
                  className="border border-[#ebebeb] rounded-pill px-5 py-3 text-sm hover:border-ink transition-all duration-200">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div>
          <h2 className="font-serif text-xl font-bold text-ink mb-6">
            Cadastrados
            {servicos.length > 0 && <span className="ml-2 text-xs font-sans font-medium text-muted">({servicos.length})</span>}
          </h2>
          {servicos.length === 0 ? (
            <div className="border border-[#ebebeb] rounded-card p-8 text-center">
              <p className="text-muted text-sm font-light">Nenhum serviço ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {servicos.map((s) => (
                <div key={s.id} className="border border-[#ebebeb] rounded-card p-4 flex items-center justify-between hover:border-[#ccc] transition-colors duration-200">
                  <div>
                    <p className="font-medium text-ink text-sm">{s.name}</p>
                    <p className="text-xs text-muted font-light mt-0.5">
                      {s.duration} min · {s.price.toLocaleString("pt-CV")} ECV
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => startEdit(s)} className="text-xs text-muted hover:text-ink transition-colors underline underline-offset-2">Editar</button>
                    <button type="button" onClick={() => handleDelete(s.id)} className="text-xs text-muted hover:text-red-600 transition-colors underline underline-offset-2">Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
