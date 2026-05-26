import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateSlots(
  start: string,
  end: string,
  duration: number,
  breakStart?: string | null,
  breakEnd?: string | null,
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

  const slots: string[] = [];
  let cur = startMin;

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const venueId = searchParams.get("venueId");
  const date    = searchParams.get("date");

  if (!venueId || !date) {
    return NextResponse.json({ error: "venueId e date são obrigatórios." }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { scheduleStart: true, scheduleEnd: true, slotDuration: true, breakStart: true, breakEnd: true },
  });

  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });

  const allSlots = generateSlots(
    venue.scheduleStart,
    venue.scheduleEnd,
    venue.slotDuration,
    venue.breakStart,
    venue.breakEnd,
  );

  const booked = await prisma.agendamento.findMany({
    where: { venueId, date, status: "confirmed" },
    select: { horario: true },
  });

  const bookedSet = new Set(booked.map((a) => a.horario));
  const slots = allSlots.filter((s) => !bookedSet.has(s));

  return NextResponse.json({ slots });
}
