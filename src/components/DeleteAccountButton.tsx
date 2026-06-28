"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export default function DeleteAccountButton() {
  const [step, setStep]       = useState<"idle" | "confirm">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Auto-reset confirmation after 10 s of inactivity
  useEffect(() => {
    if (step !== "confirm") return;
    const t = setTimeout(() => setStep("idle"), 10_000);
    return () => clearTimeout(t);
  }, [step]);

  async function handleDelete() {
    if (step === "idle") { setStep("confirm"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao eliminar conta. Tente novamente.");
      setLoading(false);
      setStep("idle");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div>
      {step === "confirm" ? (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs text-red-600 font-medium">Esta acção é irreversível. Confirma?</p>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs text-white bg-red-600 hover:bg-red-700 transition-colors px-3 py-1.5 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "A eliminar…" : "Sim, eliminar conta"}
          </button>
          <button
            onClick={() => setStep("idle")}
            disabled={loading}
            className="text-xs text-muted hover:text-ink transition-colors underline underline-offset-2"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={handleDelete}
          className="text-xs text-muted hover:text-red-600 transition-colors font-light"
        >
          Eliminar conta
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
