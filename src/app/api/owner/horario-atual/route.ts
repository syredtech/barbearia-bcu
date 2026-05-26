import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const venue = await prisma.venue.findUnique({
    where: { ownerId: session.user.id },
    select: { scheduleStart: true, scheduleEnd: true, slotDuration: true, breakStart: true, breakEnd: true, break2Start: true, break2End: true, closedDays: true },
  });

  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });

  return NextResponse.json(venue);
}
