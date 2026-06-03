"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  status: string | null | undefined;
  expiresAt: Date | string | null | undefined;
  venueStatus?: string;
}

export default function AssinaturaCard({ status, expiresAt, venueStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isActive =
    status === "active" && expiresAt && new Date(expiresAt) > new Date();

  return (
    <div className="border border-[#ebebeb] rounded-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted mb-1">
            Assinatura
          </p>
          <p className={`text-sm font-medium ${isActive ? "text-ink" : "text-red-600"}`}>
            {isActive ? "Ativa" : "Inativa"}
          </p>
          {expiresAt && (
            <p className="text-xs text-muted mt-0.5">
              Expira em {new Date(expiresAt).toLocaleDateString("pt-CV", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          )}
        </div>

        {!isActive && venueStatus === "approved" && (
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const res = await fetch("/api/stripe/checkout", { method: "POST" });
              const data = await res.json();
              if (data.url) router.push(data.url);
              else setLoading(false);
            }}
            className="bg-ink text-white px-5 py-2 rounded-pill text-xs font-medium
                       hover:bg-[#333] transition-all duration-200 disabled:opacity-40"
          >
            {loading ? "A redirecionar…" : "Assinar"}
          </button>
        )}
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        )}
      </div>
    </div>
  );
}
