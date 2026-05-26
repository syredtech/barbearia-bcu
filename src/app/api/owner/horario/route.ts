import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { scheduleStart, scheduleEnd, slotDuration, breakStart, breakEnd } = await req.json();

  if (!scheduleStart || !scheduleEnd || !slotDuration) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
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
    },
  });

  return NextResponse.json({ ok: true, venue: updated });
}
