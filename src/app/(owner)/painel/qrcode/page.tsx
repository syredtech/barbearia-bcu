"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCodePage() {
  const router = useRouter();
  const [slug, setSlug]     = useState<string | null>(null);
  const [name, setName]     = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/owner/perfil")
      .then((r) => { if (!r.ok) throw new Error("fetch"); return r.json(); })
      .then((d) => {
        if (d.slug) { setSlug(d.slug); setName(d.name ?? ""); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://belabelo.cv");
  const url = slug ? `${origin}/estabelecimentos/${slug}` : "";

  function download() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qrcode-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copyUrl() {
    if (!url) return;
    await navigator.clipboard.writeText(url)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => {});
  }

  if (loading) {
    return (
      <main className="max-w-content mx-auto px-6 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#f0f0f0] rounded w-48" />
          <div className="h-64 bg-[#f0f0f0] rounded w-64" />
        </div>
      </main>
    );
  }

  if (!slug) {
    return (
      <main className="max-w-content mx-auto px-6 py-16">
        <p className="text-muted text-sm">Estabelecimento não encontrado.</p>
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

      <div className="max-w-[480px]">
        <p className="text-xs text-muted uppercase tracking-widest mb-2">Partilhar</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-8">
          QR Code
        </h1>

        <div className="border border-[#ebebeb] rounded-card p-8 flex flex-col items-center gap-6 mb-6">
          {/* QR Code */}
          <div ref={canvasRef} className="p-4 bg-white rounded-[12px] shadow-sm border border-[#f0f0f0]">
            <QRCodeCanvas
              value={url}
              size={220}
              bgColor="#ffffff"
              fgColor="#141414"
              level="M"
              includeMargin={false}
            />
          </div>

          {/* Venue name */}
          <div className="text-center">
            <p className="font-serif font-bold text-ink text-lg">{name}</p>
            <p className="text-xs text-muted mt-1 break-all font-light">{url}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={download}
            className="w-full bg-ink text-white rounded-card py-3.5 text-sm font-medium
                       hover:bg-[#333] transition-all duration-200"
          >
            Descarregar PNG
          </button>
          <button
            type="button"
            onClick={copyUrl}
            className="w-full border border-[#ebebeb] rounded-card py-3.5 text-sm font-medium
                       text-ink hover:border-ink transition-all duration-200"
          >
            {copied ? "Link copiado!" : "Copiar link"}
          </button>
        </div>

        <p className="text-xs text-muted font-light mt-6 text-center">
          Ao ler este QR code, os clientes são direcionados diretamente para a página de agendamento do seu estabelecimento.
        </p>

        <noscript>
          <p className="text-xs text-muted mt-4 text-center">
            URL do estabelecimento:{" "}
            <a href={url} className="underline text-ink">{url}</a>
          </p>
        </noscript>
      </div>
    </main>
  );
}
