import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const { searchParams } = req.nextUrl;
  const venueId = searchParams.get("venueId");
  const date    = searchParams.get("date");

  if (!venueId || !date) {
    return NextResponse.json({ error: "venueId e date são obrigatórios." }, { status: 400 });
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
    },
  });

  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });

  // Check if the requested day is a closed day
  const closedDays: number[] = JSON.parse(venue.closedDays || "[]");
  const requestedDate = new Date(date + "T12:00:00");
  const weekday = requestedDate.getDay(); // 0=Sunday, 1=Monday, ...
  if (closedDays.includes(weekday)) {
    return NextResponse.json({ slots: [] });
  }

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

  const bookedSet = new Set(booked.map((a) => a.horario));
  const slots = allSlots.filter((s) => !bookedSet.has(s));

  return NextResponse.json({ slots });
}
