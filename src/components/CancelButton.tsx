"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelButton({ agendamentoId }: { agendamentoId: string }) {
  const router = useRouter();
  const [loading, setLoading]     = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError]         = useState("");

  async function cancel() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/agendamentos/${agendamentoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao cancelar agendamento.");
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={cancel}
        disabled={loading}
        className="text-xs text-muted hover:text-red-600 transition-colors font-light disabled:opacity-40"
      >
        {loading ? "A cancelar…" : confirmed ? "Tem a certeza? Clique novamente." : "Cancelar agendamento"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
