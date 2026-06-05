import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const rawVenueId = req.nextUrl.searchParams.get("venueId");
  const venueId = rawVenueId && rawVenueId.length <= 100 ? rawVenueId : null;
  const page = Math.min(Math.max(0, parseInt(req.nextUrl.searchParams.get("page") ?? "0")), 1000);
  const take = 100;
  const skip = page * take;

  const agendamentos = await prisma.agendamento.findMany({
    where: venueId ? { venueId } : undefined,
    select: {
      id: true,
      date: true,
      horario: true,
      status: true,
      guestName: true,
      createdAt: true,
      client: { select: { name: true, email: true } },
      venue: { select: { name: true, category: true } },
      servico: { select: { name: true, price: true } },
    },
    orderBy: [{ date: "desc" }, { horario: "asc" }],
    take,
    skip,
  });

  return NextResponse.json(agendamentos);
}
