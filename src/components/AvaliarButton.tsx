"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AvaliarButton({ agendamentoId, venueId }: { agendamentoId: string; venueId: string }) {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");
  const [hover, setHover]     = useState(0);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (rating === 0) return;
    setLoading(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agendamentoId, venueId, rating, comment }),
    });
    router.refresh();
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="text-xs text-ink underline underline-offset-2 font-light"
    >
      Avaliar serviço
    </button>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted font-light">A sua avaliação:</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(s)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24"
              fill={(hover || rating) >= s ? "#141414" : "none"}
              stroke="#141414" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentário (opcional)"
        rows={2}
        className="w-full border border-[#ebebeb] rounded-card px-3 py-2 text-sm font-light
                   focus:outline-none focus:border-ink transition-colors resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading || rating === 0}
          className="bg-ink text-white px-4 py-2 rounded-pill text-xs font-medium hover:bg-[#333] transition-all disabled:opacity-40"
        >
          {loading ? "A enviar…" : "Enviar avaliação"}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-muted">
          Cancelar
        </button>
      </div>
    </div>
  );
}
