import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const venueId = req.nextUrl.searchParams.get("venueId");

  const agendamentos = await prisma.agendamento.findMany({
    where: venueId ? { venueId } : undefined,
    include: {
      client: { select: { name: true, email: true } },
      venue: { select: { name: true, category: true } },
      servico: { select: { name: true, price: true } },
    },
    orderBy: [{ date: "desc" }, { horario: "asc" }],
    take: 100,
  });

  return NextResponse.json(agendamentos);
}
