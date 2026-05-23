"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface Servico { id: string; name: string; duration: number; price: number }
interface VenueData { id: string; name: string; slug: string; servicos: Servico[] }

export default function AgendarPage({ params }: { params: { slug: string } }) {
  const { data: session, status } = useSession();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [venue, setVenue]     = useState<VenueData | null>(null);
  const [step, setStep]       = useState<1 | 2 | 3>(() => searchParams.get("servicoId") ? 2 : 1);
  const [servicoId, setServicoId] = useState(searchParams.get("servicoId") || "");
  const [date, setDate]       = useState("");
  const [horario, setHorario] = useState("");
  const [slots, setSlots]     = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [guestName, setGuestName]   = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  useEffect(() => {
    fetch(`/api/venues/${params.slug}`).then((r) => r.json()).then(setVenue);
  }, [params.slug]);

  useEffect(() => {
    if (!servicoId || !date || !venue) return;
    fetch(`/api/horarios-disponiveis?venueId=${venue.id}&date=${date}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []));
  }, [servicoId, date, venue]);

  const isGuest = status === "unauthenticated";
  const guestReady = !isGuest || (guestName.trim().length > 0 && guestPhone.trim().length > 0);

  async function confirmar() {
    if (!guestReady) return;
    setLoading(true);
    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId: venue!.id,
        servicoId,
        date,
        horario,
        ...(isGuest ? { guestName: guestName.trim(), guestPhone: guestPhone.trim() } : {}),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
    } else {
      const d = await res.json();
      setBookingError(d.error || "Erro ao confirmar o agendamento.");
    }
  }

  if (!venue) {
    return (
      <main className="max-w-content mx-auto px-6 py-24 text-center">
        <p className="text-muted text-sm">A carregar…</p>
      </main>
    );
  }

  if (done) {
    const servico = venue.servicos.find((s) => s.id === servicoId);
    return (
      <main className="max-w-content mx-auto px-6 py-24 text-center">
        <p className="text-5xl mb-6 fade-up">✓</p>
        <h1 className="font-serif text-4xl font-bold text-ink mb-3 fade-up-1">
          Agendamento confirmado.
        </h1>
        <p className="text-muted font-light text-sm mb-8 fade-up-2">
          {venue.name} · {new Date(date + "T12:00:00").toLocaleDateString("pt-CV", { weekday: "long", day: "numeric", month: "long" })} às {horario}
        </p>
        {!isGuest && (
          <a
            href="/minha-conta"
            className="inline-block bg-ink text-white px-7 py-3 rounded-pill text-sm font-medium
                       hover:bg-[#333] transition-all duration-200 fade-up-2"
          >
            Ver meus agendamentos
          </a>
        )}
      </main>
    );
  }

  const servico = venue.servicos.find((s) => s.id === servicoId);
  const today   = new Date().toISOString().split("T")[0];

  const steps = ["Serviço", "Data", "Horário"];

  return (
    <main className="max-w-[540px] mx-auto px-6 py-16">
      {/* Header */}
      <p className="text-xs text-muted mb-2">{venue.name}</p>
      <h1 className="font-serif text-3xl font-bold text-ink mb-8">Novo agendamento</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${step > i + 1 ? "text-ink" : step === i + 1 ? "text-ink" : "text-muted"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium
                ${step > i + 1 ? "bg-ink text-white" : step === i + 1 ? "border-2 border-ink text-ink" : "border border-[#ebebeb] text-muted"}`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className="text-xs hidden sm:block">{label}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-px w-8 ${step > i + 1 ? "bg-ink" : "bg-[#ebebeb]"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Serviço */}
      {step === 1 && (
        <div className="space-y-3">
          {venue.servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => { setServicoId(s.id); setStep(2); }}
              className={`w-full text-left border rounded-card p-5 transition-all duration-200
                ${servicoId === s.id ? "border-ink" : "border-[#ebebeb] hover:border-[#bbb]"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-serif font-bold text-ink text-[15px]">{s.name}</p>
                  <p className="text-muted text-xs mt-1">{s.duration} min</p>
                </div>
                <p className="text-ink font-medium text-sm">{s.price.toLocaleString("pt-CV")} ECV</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2 — Data */}
      {step === 2 && (
        <div>
          <label className="block text-xs text-muted mb-3 uppercase tracking-widest">
            Escolha a data
          </label>
          <input
            type="date" min={today} value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-[#ebebeb] rounded-card px-4 py-3 text-sm font-light
                       focus:outline-none focus:border-ink transition-colors duration-200 mb-6"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-[#ebebeb] rounded-pill py-3 text-sm font-light hover:border-[#bbb] transition-all duration-200"
            >
              Voltar
            </button>
            <button
              onClick={() => date && setStep(3)}
              disabled={!date}
              className="flex-1 bg-ink text-white rounded-pill py-3 text-sm font-medium
                         hover:bg-[#333] transition-all duration-200 disabled:opacity-30"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Horário */}
      {step === 3 && (
        <div>
          <label className="block text-xs text-muted mb-3 uppercase tracking-widest">
            Escolha o horário
          </label>
          {slots.length === 0 ? (
            <p className="text-muted text-sm font-light mb-6">
              Nenhum horário disponível nesta data.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 mb-6">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setHorario(slot)}
                  className={`border rounded-card py-2.5 text-sm transition-all duration-200
                    ${horario === slot
                      ? "bg-ink text-white border-ink"
                      : "border-[#ebebeb] text-ink hover:border-[#bbb]"}`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}

          {horario && servico && (
            <div className="border border-[#ebebeb] rounded-card p-4 mb-6 space-y-1.5">
              <p className="text-xs text-muted uppercase tracking-widest mb-2">Resumo</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted font-light">Serviço</span>
                <span className="text-ink font-medium">{servico.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted font-light">Data</span>
                <span className="text-ink font-medium">
                  {new Date(date + "T12:00:00").toLocaleDateString("pt-CV", { weekday: "short", day: "numeric", month: "short" })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted font-light">Horário</span>
                <span className="text-ink font-medium">{horario}</span>
              </div>
              <div className="divider my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted font-light">Total</span>
                <span className="text-ink font-bold">{servico.price.toLocaleString("pt-CV")} ECV</span>
              </div>
            </div>
          )}

          {isGuest && horario && (
            <div className="space-y-3 mb-6">
              <p className="text-xs text-muted uppercase tracking-widest">Os seus dados</p>
              <input
                type="text"
                placeholder="Nome completo"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full border border-[#ebebeb] rounded-card px-4 py-3 text-sm font-light
                           focus:outline-none focus:border-ink transition-colors duration-200"
              />
              <input
                type="tel"
                placeholder="Número de telefone"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full border border-[#ebebeb] rounded-card px-4 py-3 text-sm font-light
                           focus:outline-none focus:border-ink transition-colors duration-200"
              />
            </div>
          )}

          {bookingError && (
            <p className="text-red-500 text-sm font-light mb-4">{bookingError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 border border-[#ebebeb] rounded-pill py-3 text-sm font-light hover:border-[#bbb] transition-all duration-200"
            >
              Voltar
            </button>
            <button
              onClick={confirmar}
              disabled={!horario || loading || !guestReady}
              className="flex-1 bg-ink text-white rounded-pill py-3 text-sm font-medium
                         hover:bg-[#333] transition-all duration-200 disabled:opacity-30"
            >
              {loading ? "A confirmar…" : isGuest ? "Finalizar agendamento" : "Confirmar agendamento"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
