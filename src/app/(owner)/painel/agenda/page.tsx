"use client";
import { useEffect, useState, useCallback } from "react";

const WEEKDAYS_SHORT = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
const WEEKDAYS_FULL  = ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

interface Agendamento {
  id: string;
  date: string;
  horario: string;
  status: string;
  client: { name: string; email: string } | null;
  guestName: string | null;
  guestPhone: string | null;
  servico: { name: string; duration: number; price: number };
}

interface ScheduleConfig {
  scheduleStart: string;
  scheduleEnd: string;
  slotDuration: number;
  breakStart: string | null;
  breakEnd: string | null;
  break2Start: string | null;
  break2End: string | null;
  closedDays: string;
}

function toISO(d: Date) { return d.toISOString().split("T")[0]; }

function getWeekDates(base: Date): string[] {
  const d = new Date(base);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    return toISO(nd);
  });
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toStr(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function generateSlots(
  start: string, end: string, duration: number,
  breakStart?: string | null, breakEnd?: string | null,
  break2Start?: string | null, break2End?: string | null,
): string[] {
  const startMin = toMin(start);
  const endMin   = toMin(end);
  const bsMin    = breakStart  ? toMin(breakStart)  : null;
  const beMin    = breakEnd    ? toMin(breakEnd)    : null;
  const bs2Min   = break2Start ? toMin(break2Start) : null;
  const be2Min   = break2End   ? toMin(break2End)   : null;
  const slots: string[] = [];
  let cur = startMin;
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

export default function AgendaPage() {
  const today = toISO(new Date());
  const [weekBase, setWeekBase]       = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [schedule, setSchedule]       = useState<ScheduleConfig | null>(null);
  const [loading, setLoading]         = useState(true);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);

  const weekDates = getWeekDates(weekBase);

  const load = useCallback(async () => {
    const [agRes, schRes] = await Promise.all([
      fetch("/api/agendamentos"),
      fetch("/api/owner/horario-atual"),
    ]);
    if (agRes.ok) {
      const data = await agRes.json();
      setAgendamentos(data);
    }
    if (schRes.ok) {
      const data = await schRes.json();
      setSchedule(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // SSE — push imediato ao criar agendamento, sem polling
  useEffect(() => {
    let es: EventSource;
    function connect() {
      es = new EventSource("/api/owner/events");
      es.onmessage = () => load();
      es.onerror = () => { es.close(); setTimeout(connect, 1000); };
    }
    connect();
    return () => es?.close();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    load();
  }

  // Compute slots for selected date
  const allSlots: string[] = (() => {
    if (!schedule) return [];
    const closedDays: number[] = (() => {
      try { return JSON.parse(schedule.closedDays || "[]"); } catch { return []; }
    })();
    const weekday = new Date(selectedDate + "T12:00:00").getDay();
    if (closedDays.includes(weekday)) return [];
    return generateSlots(
      schedule.scheduleStart,
      schedule.scheduleEnd,
      schedule.slotDuration,
      schedule.breakStart,
      schedule.breakEnd,
      schedule.break2Start,
      schedule.break2End,
    );
  })();

  const countByDate = agendamentos.reduce<Record<string, number>>((acc, a) => {
    if (a.status !== "cancelled") {
      acc[a.date] = (acc[a.date] ?? 0) + 1;
    }
    return acc;
  }, {});

  const dayAgendamentos = agendamentos.filter((a) => a.date === selectedDate);
  const bySlot: Record<string, Agendamento[]> = {};
  dayAgendamentos.forEach((a) => {
    if (!bySlot[a.horario]) bySlot[a.horario] = [];
    bySlot[a.horario].push(a);
  });
  const activeDayCount = dayAgendamentos.filter((a) => a.status !== "cancelled").length;

  function prevWeek() {
    const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d);
  }
  function nextWeek() {
    const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d);
  }
  function goToday() { setWeekBase(new Date()); setSelectedDate(today); }

  const selIndex = weekDates.indexOf(selectedDate);
  const selParts = selectedDate.split("-");
  const selDayLabel   = selIndex >= 0 ? WEEKDAYS_FULL[selIndex] : "";
  const selMonthLabel = MONTHS[parseInt(selParts[1]) - 1];
  const selDayNum     = parseInt(selParts[2]);

  // Week label: "19–25 de Maio 2026"
  const wStart = weekDates[0].split("-");
  const wEnd   = weekDates[6].split("-");
  const weekLabel = `${parseInt(wStart[2])}–${parseInt(wEnd[2])} de ${MONTHS[parseInt(wStart[1]) - 1]} ${wStart[0]}`;

  return (
    <main className="max-w-content mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-2">Painel</p>
          <h1 className="font-serif text-4xl font-bold text-ink">Agenda</h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevWeek}
            className="border border-[#ebebeb] px-3.5 py-2 rounded-pill text-sm text-muted hover:border-ink hover:text-ink transition-all duration-200">
            ←
          </button>
          <button type="button" onClick={goToday}
            className="border border-[#ebebeb] px-4 py-2 rounded-pill text-sm text-muted hover:border-ink hover:text-ink transition-all duration-200">
            Hoje
          </button>
          <button type="button" onClick={nextWeek}
            className="border border-[#ebebeb] px-3.5 py-2 rounded-pill text-sm text-muted hover:border-ink hover:text-ink transition-all duration-200">
            →
          </button>
        </div>
      </div>

      {/* Week label */}
      <p className="text-xs text-muted uppercase tracking-widest mb-4">{weekLabel}</p>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-2 mb-10">
        {weekDates.map((date, i) => {
          const isToday    = date === today;
          const isSelected = date === selectedDate;
          const count      = countByDate[date] ?? 0;
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`rounded-card py-3 px-2 text-center transition-all duration-200 border
                ${isSelected
                  ? "bg-ink border-ink"
                  : isToday
                  ? "border-ink"
                  : "border-[#ebebeb] hover:border-[#bbb]"
                }`}
            >
              <p className={`text-[10px] font-medium uppercase tracking-widest mb-1
                ${isSelected ? "text-white/60" : "text-muted"}`}>
                {WEEKDAYS_SHORT[i]}
              </p>
              <p className={`font-serif font-bold text-xl leading-none
                ${isSelected ? "text-white" : "text-ink"}`}>
                {parseInt(date.split("-")[2])}
              </p>
              <div className="h-3 flex items-center justify-center mt-1">
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold
                    ${isSelected ? "bg-white/20 text-white" : "bg-ink text-white"}`}>
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">
            {selDayLabel && `${selDayLabel}, `}{selDayNum} de {selMonthLabel}
          </h2>
          <p className="text-muted text-sm font-light mt-1">
            {loading
              ? "A carregar…"
              : allSlots.length === 0
              ? "Dia de folga"
              : activeDayCount === 0
              ? "Nenhuma marcação"
              : `${activeDayCount} marcaç${activeDayCount !== 1 ? "ões" : "ão"} em ${Object.keys(bySlot).length} horário${Object.keys(bySlot).length !== 1 ? "s" : ""}`
            }
          </p>
        </div>
      </div>

      {/* Day timeline */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-14 shrink-0" />
              <div className="flex-1 h-14 rounded-card bg-[#f5f5f5] animate-pulse" />
            </div>
          ))}
        </div>
      ) : allSlots.length === 0 ? (
        <div className="border border-dashed border-[#e4e4e4] rounded-card p-10 text-center">
          <p className="text-muted text-sm font-light">Este dia está marcado como dia de folga.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allSlots.map((slot) => {
            const slotBookings = bySlot[slot] ?? [];
            return (
              <div key={slot} className="flex items-stretch gap-4">
                {/* Time label */}
                <span className="text-sm text-muted font-light w-14 shrink-0 flex items-center justify-end pr-1">
                  {slot}
                </span>

                {slotBookings.length > 0 ? (
                  /* Booked slot — one card per booking */
                  <div className="flex-1 space-y-2">
                    {slotBookings.map((a) => (
                      <div key={a.id} className="border border-[#ebebeb] rounded-card px-4 py-3.5 bg-white
                                      hover:border-[#ccc] transition-colors duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shrink-0">
                            <span className="text-white text-[10px] font-serif font-bold leading-none">
                              {initials(a.client?.name ?? a.guestName ?? "?")}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-ink text-sm leading-tight truncate">
                              {a.client?.name ?? a.guestName ?? "Convidado"}
                            </p>
                            <p className="text-xs text-muted font-light mt-0.5">
                              {a.servico.name}
                              <span className="mx-1.5 text-[#d0d0d0]">·</span>
                              {a.servico.duration} min
                              <span className="mx-1.5 text-[#d0d0d0]">·</span>
                              {a.servico.price.toLocaleString("pt-CV")} ECV
                            </p>
                            {a.status === "confirmed" && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => updateStatus(a.id, "completed")}
                                  disabled={updatingId === a.id}
                                  className="text-[10px] font-medium text-green-700 bg-green-50 px-2.5 py-0.5 rounded-pill hover:bg-green-100 transition-colors disabled:opacity-40"
                                >
                                  Concluído
                                </button>
                                <button
                                  onClick={() => updateStatus(a.id, "cancelled")}
                                  disabled={updatingId === a.id}
                                  className="text-[10px] font-medium text-red-600 bg-red-50 px-2.5 py-0.5 rounded-pill hover:bg-red-100 transition-colors disabled:opacity-40"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                            {a.status !== "confirmed" && (
                              <span className={`inline-block mt-1 text-[10px] font-medium uppercase tracking-widest px-2.5 py-0.5 rounded-pill ${
                                a.status === "completed" ? "text-blue-700 bg-blue-50" : "text-red-600 bg-red-50"
                              }`}>
                                {a.status === "completed" ? "Concluído" : "Cancelado"}
                              </span>
                            )}
                          </div>
                          {a.status === "confirmed" && (
                            <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest
                                             text-green-700 bg-green-50 px-2.5 py-0.5 rounded-pill">
                              Confirmado
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Free slot — compact */
                  <div className="flex-1 flex items-center h-9">
                    <div className="flex-1 border-b border-[#f0f0f0]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
