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
  break2Start: string, break2End: string, hasBreak2: boolean,
) {
  const bsMin  = hasBreak  && breakStart  ? toMin(breakStart)  : null;
  const beMin  = hasBreak  && breakEnd    ? toMin(breakEnd)    : null;
  const bs2Min = hasBreak2 && break2Start ? toMin(break2Start) : null;
  const be2Min = hasBreak2 && break2End   ? toMin(break2End)   : null;
  const endMin = toMin(end);
  const slots: string[] = [];
  let cur = toMin(start);
  while (cur + duration <= endMin) {
    const inBreak1 = bsMin !== null && beMin !== null && cur >= bsMin && cur < beMin;
    const inBreak2 = bs2Min !== null && be2Min !== null && cur >= bs2Min && cur < be2Min;
    if (inBreak1) { cur = beMin!; continue; }
    if (inBreak2) { cur = be2Min!; continue; }
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
  const [hasBreak2, setHasBreak2]   = useState(false);
  const [break2Start, setBreak2Start] = useState("15:00");
  const [break2End, setBreak2End]     = useState("15:30");
  const [closedDays, setClosedDays] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/owner/horario-atual")
      .then((r) => r.json())
      .then((d) => {
        if (d.scheduleStart) setStart(d.scheduleStart);
        if (d.scheduleEnd)   setEnd(d.scheduleEnd);
        if (d.slotDuration)  setDuration(d.slotDuration);
        if (d.breakStart)  { setHasBreak(true); setBreakStart(d.breakStart); }
        if (d.breakEnd)      setBreakEnd(d.breakEnd);
        if (d.break2Start) { setHasBreak2(true); setBreak2Start(d.break2Start); }
        if (d.break2End)     setBreak2End(d.break2End);
        if (d.closedDays) {
          try { setClosedDays(JSON.parse(d.closedDays)); } catch { setClosedDays([]); }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const preview = generatePreview(start, end, duration, breakStart, breakEnd, hasBreak, break2Start, break2End, hasBreak2);

  function toggleClosedDay(day: number) {
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

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
        breakStart:    hasBreak  ? breakStart  : null,
        breakEnd:      hasBreak  ? breakEnd    : null,
        break2Start:   hasBreak2 ? break2Start : null,
        break2End:     hasBreak2 ? break2End   : null,
        closedDays,
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

        {/* Dias fechados */}
        <div className="border border-[#ebebeb] rounded-card p-6 mb-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted mb-4">Dias de folga</p>
          <div className="flex flex-wrap gap-2">
            {[
              { day: 1, label: "Seg" }, { day: 2, label: "Ter" }, { day: 3, label: "Qua" },
              { day: 4, label: "Qui" }, { day: 5, label: "Sex" }, { day: 6, label: "Sáb" }, { day: 0, label: "Dom" }
            ].map(({ day, label }) => (
              <button
                key={day}
                onClick={() => toggleClosedDay(day)}
                className={`px-4 py-2 rounded-pill text-sm font-medium border transition-all duration-200 ${
                  closedDays.includes(day)
                    ? "bg-ink text-white border-ink"
                    : "border-[#ebebeb] text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-3 font-light">
            Os dias selecionados não terão horários disponíveis para agendamento.
          </p>
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

        {/* Pausa 1 */}
        <div className="border border-[#ebebeb] rounded-card p-6 mb-4">
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

        {/* Pausa 2 */}
        <div className="border border-[#ebebeb] rounded-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              Segunda pausa
            </p>
            <button
              onClick={() => setHasBreak2(!hasBreak2)}
              className={`w-10 h-6 rounded-full transition-all duration-200 relative ${
                hasBreak2 ? "bg-ink" : "bg-[#ebebeb]"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                  hasBreak2 ? "left-5" : "left-1"
                }`}
              />
            </button>
          </div>

          {hasBreak2 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">Início da pausa</label>
                <select
                  value={break2Start}
                  onChange={(e) => setBreak2Start(e.target.value)}
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
                  value={break2End}
                  onChange={(e) => setBreak2End(e.target.value)}
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
              {preview.map((slot) => (
                <span
                  key={slot}
                  className="px-3 py-1.5 rounded-pill text-xs font-medium border border-[#ebebeb] text-ink"
                >
                  {slot}
                </span>
              ))}
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
