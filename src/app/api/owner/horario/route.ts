import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { scheduleStart, scheduleEnd, slotDuration, breakStart, breakEnd, break2Start, break2End, closedDays } = await req.json();

  if (!scheduleStart || !scheduleEnd || !slotDuration) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(scheduleStart)) {
    return NextResponse.json({ error: "scheduleStart inválido. Use o formato HH:MM." }, { status: 400 });
  }
  if (!timeRegex.test(scheduleEnd)) {
    return NextResponse.json({ error: "scheduleEnd inválido. Use o formato HH:MM." }, { status: 400 });
  }
  const slotNum = Number(slotDuration);
  if (isNaN(slotNum) || slotNum < 15 || slotNum > 480) {
    return NextResponse.json({ error: "slotDuration deve ser um número entre 15 e 480." }, { status: 400 });
  }
  if (breakStart && !timeRegex.test(breakStart)) {
    return NextResponse.json({ error: "breakStart inválido. Use o formato HH:MM." }, { status: 400 });
  }
  if (breakEnd && !timeRegex.test(breakEnd)) {
    return NextResponse.json({ error: "breakEnd inválido. Use o formato HH:MM." }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });

  const updated = await prisma.venue.update({
    where: { id: venue.id },
    data: {
      scheduleStart,
      scheduleEnd,
      slotDuration: Number(slotDuration),
      breakStart: breakStart || null,
      breakEnd: breakEnd || null,
      break2Start: break2Start || null,
      break2End: break2End || null,
      closedDays: JSON.stringify(closedDays || []),
    },
  });

  return NextResponse.json({ ok: true, venue: updated });
}
