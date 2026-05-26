"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelButton({ agendamentoId }: { agendamentoId: string }) {
  const router = useRouter();
  const [loading, setLoading]     = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function cancel() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    await fetch(`/api/agendamentos/${agendamentoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={cancel}
      disabled={loading}
      className="text-xs text-muted hover:text-red-600 transition-colors font-light disabled:opacity-40"
    >
      {loading ? "A cancelar…" : confirmed ? "Tem a certeza? Clique novamente." : "Cancelar agendamento"}
    </button>
  );
}
