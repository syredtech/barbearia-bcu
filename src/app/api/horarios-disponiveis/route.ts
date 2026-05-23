import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALL_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const venueId = searchParams.get("venueId");
  const date = searchParams.get("date");

  if (!venueId || !date) {
    return NextResponse.json({ error: "venueId e date são obrigatórios." }, { status: 400 });
  }

  const booked = await prisma.agendamento.findMany({
    where: { venueId, date, status: "confirmed" },
    select: { horario: true },
  });

  const bookedSlots = new Set(booked.map((a) => a.horario));
  const slots = ALL_SLOTS.filter((s) => !bookedSlots.has(s));

  return NextResponse.json({ slots });
}
