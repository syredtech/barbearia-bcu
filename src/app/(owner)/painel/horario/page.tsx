"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, "0")}:00`
);
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toStr(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function generatePreview(
  start: string, end: string, duration: number,
  breakStart: string, breakEnd: string, hasBreak: boolean,
) {
  const bsMin = hasBreak && breakStart ? toMin(breakStart) : null;
  const beMin = hasBreak && breakEnd   ? toMin(breakEnd)   : null;
  const endMin = toMin(end);
  const slots: string[] = [];
  let cur = toMin(start);
  while (cur + duration <= endMin) {
    if (bsMin !== null && beMin !== null && cur >= bsMin && cur < beMin) {
      cur = beMin;
      continue;
    }
    slots.push(toStr(cur));
    cur += duration;
  }
  return slots;
}

export default function HorarioPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  const [start, setStart]           = useState("09:00");
  const [end, setEnd]               = useState("18:00");
  const [duration, setDuration]     = useState(60);
  const [hasBreak, setHasBreak]     = useState(false);
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd]     = useState("13:00");

  useEffect(() => {
    fetch("/api/owner/horario-atual")
      .then((r) => r.json())
      .then((d) => {
        if (d.scheduleStart) setStart(d.scheduleStart);
        if (d.scheduleEnd)   setEnd(d.scheduleEnd);
        if (d.slotDuration)  setDuration(d.slotDuration);
        if (d.breakStart)  { setHasBreak(true); setBreakStart(d.breakStart); }
        if (d.breakEnd)      setBreakEnd(d.breakEnd);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const timeOptions = duration === 30 ? HALF_HOURS : HOURS;
  const preview = generatePreview(start, end, duration, breakStart, breakEnd, hasBreak);

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/owner/horario", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduleStart: start,
        scheduleEnd:   end,
        slotDuration:  duration,
        breakStart:    hasBreak ? breakStart : null,
        breakEnd:      hasBreak ? breakEnd   : null,
      }),
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
      {/* Header */}
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
          Horário de funcionamento
        </h1>

        {/* Abertura / Fecho */}
        <div className="border border-[#ebebeb] rounded-card p-6 mb-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted mb-4">
            Período de funcionamento
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted block mb-1.5">Abertura</label>
              <select
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full border border-[#ebebeb] rounded-card px-3 py-2.5 text-sm
                           focus:outline-none focus:border-ink transition-colors"
              >
                {HALF_HOURS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1.5">Fecho</label>
              <select
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full border border-[#ebebeb] rounded-card px-3 py-2.5 text-sm
                           focus:outline-none focus:border-ink transition-colors"
              >
                {HALF_HOURS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Escala */}
        <div className="border border-[#ebebeb] rounded-card p-6 mb-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted mb-4">
            Escala de agendamentos
          </p>
          <div className="flex gap-3">
            {[
              { value: 60, label: "1 hora" },
              { value: 30, label: "30 minutos" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                className={`flex-1 py-3 rounded-card text-sm font-medium border transition-all duration-200 ${
                  duration === opt.value
                    ? "bg-ink text-white border-ink"
                    : "border-[#ebebeb] text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pausa */}
        <div className="border border-[#ebebeb] rounded-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              Pausa / Almoço
            </p>
            <button
              onClick={() => setHasBreak(!hasBreak)}
              className={`w-10 h-6 rounded-full transition-all duration-200 relative ${
                hasBreak ? "bg-ink" : "bg-[#ebebeb]"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                  hasBreak ? "left-5" : "left-1"
                }`}
              />
            </button>
          </div>

          {hasBreak && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">Início da pausa</label>
                <select
                  value={breakStart}
                  onChange={(e) => setBreakStart(e.target.value)}
                  className="w-full border border-[#ebebeb] rounded-card px-3 py-2.5 text-sm
                             focus:outline-none focus:border-ink transition-colors"
                >
                  {HALF_HOURS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Fim da pausa</label>
                <select
                  value={breakEnd}
                  onChange={(e) => setBreakEnd(e.target.value)}
                  className="w-full border border-[#ebebeb] rounded-card px-3 py-2.5 text-sm
                             focus:outline-none focus:border-ink transition-colors"
                >
                  {HALF_HOURS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted mb-3">
            Pré-visualização dos horários
          </p>
          {preview.length === 0 ? (
            <p className="text-sm text-muted">Nenhum horário disponível com esta configuração.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {preview.map((slot) => {
                const slotMin = toMin(slot);
                const bsMin = hasBreak ? toMin(breakStart) : null;
                const beMin = hasBreak ? toMin(breakEnd)   : null;
                const inBreak = bsMin !== null && beMin !== null && slotMin >= bsMin && slotMin < beMin;
                return (
                  <span
                    key={slot}
                    className={`px-3 py-1.5 rounded-pill text-xs font-medium border ${
                      inBreak
                        ? "border-[#ebebeb] text-[#ccc]"
                        : "border-[#ebebeb] text-ink"
                    }`}
                  >
                    {slot}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          onClick={save}
          disabled={saving || preview.length === 0}
          className="w-full bg-ink text-white rounded-card py-3.5 text-sm font-medium
                     hover:bg-[#333] transition-all duration-200 disabled:opacity-40"
        >
          {saving ? "A guardar…" : saved ? "Guardado ✓" : "Guardar horário"}
        </button>
      </div>
    </main>
  );
}
