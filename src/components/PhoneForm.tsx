"use client";
import { useState, useEffect } from "react";

export default function PhoneForm() {
  const [phone, setPhone]       = useState("");
  const [status, setStatus]     = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/user/perfil")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.phone) setPhone(d.phone); })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");
    const r = await fetch("/api/user/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim() || null }),
    });
    if (r.ok) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      const d = await r.json().catch(() => ({}));
      setErrorMsg(d.error ?? "Erro ao guardar.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="phone" className="block text-xs text-muted mb-1.5">
          Número de telefone
        </label>
        <div className="flex gap-3">
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setStatus("idle"); }}
            placeholder="Ex: 9911234"
            className="flex-1 border border-[#e0dbd4] rounded-pill px-4 py-2.5 text-sm font-light
                       focus:outline-none focus:border-ink transition-colors duration-200 max-w-[220px]"
          />
          <button
            type="submit"
            disabled={status === "saving"}
            className="bg-ink text-white px-5 py-2.5 rounded-pill text-sm font-medium
                       hover:bg-[#333] transition-all duration-200 disabled:opacity-40"
          >
            {status === "saving" ? "…" : "Guardar"}
          </button>
        </div>
        <p className="text-[11px] text-muted mt-1.5 font-light">
          Usado para enviar confirmação de agendamento por SMS.
        </p>
      </div>
      {status === "saved" && (
        <p className="text-xs text-green-700">Telefone guardado com sucesso.</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}
    </form>
  );
}
