import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

function generateSlots(
  start: string,
  end: string,
  duration: number,
  breakStart?: string | null,
  breakEnd?: string | null,
  break2Start?: string | null,
  break2End?: string | null,
): string[] {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const toStr = (min: number) =>
    `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

  const startMin = toMin(start);
  const endMin   = toMin(end);
  const bsMin    = breakStart ? toMin(breakStart) : null;
  const beMin    = breakEnd   ? toMin(breakEnd)   : null;
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

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`horarios:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const venueId = searchParams.get("venueId");
  const date    = searchParams.get("date");

  if (!venueId || !date) {
    return NextResponse.json({ error: "venueId e date são obrigatórios." }, { status: 400 });
  }
  if (venueId.length > 100) {
    return NextResponse.json({ error: "venueId inválido." }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date + "T12:00:00"))) {
    return NextResponse.json({ error: "Formato de data inválido." }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  if (date < today) {
    return NextResponse.json({ error: "Não é possível consultar datas passadas." }, { status: 400 });
  }

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  if (date > maxDate.toISOString().split("T")[0]) {
    return NextResponse.json({ error: "Data demasiado distante (máx. 1 ano)." }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      scheduleStart: true,
      scheduleEnd: true,
      slotDuration: true,
      breakStart: true,
      breakEnd: true,
      break2Start: true,
      break2End: true,
      closedDays: true,
      _count: { select: { funcionarios: true } },
    },
  });

  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });

  const closedDays: number[] = (() => { try { return JSON.parse(venue.closedDays || "[]"); } catch { return []; } })();
  const weekday = new Date(date + "T12:00:00").getDay();
  if (closedDays.includes(weekday)) {
    return NextResponse.json({ slots: [] });
  }

  const capacity = Math.max(1, venue._count.funcionarios);

  const allSlots = generateSlots(
    venue.scheduleStart,
    venue.scheduleEnd,
    venue.slotDuration,
    venue.breakStart,
    venue.breakEnd,
    venue.break2Start,
    venue.break2End,
  );

  const booked = await prisma.agendamento.findMany({
    where: { venueId, date, status: "confirmed" },
    select: { horario: true },
  });

  const countBySlot: Record<string, number> = {};
  for (const a of booked) {
    countBySlot[a.horario] = (countBySlot[a.horario] ?? 0) + 1;
  }

  const slots = allSlots.filter((s) => (countBySlot[s] ?? 0) < capacity);

  return NextResponse.json({ slots });
}
