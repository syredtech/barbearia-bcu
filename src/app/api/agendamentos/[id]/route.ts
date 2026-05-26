import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { status } = await req.json();
  const validStatuses = ["cancelled", "completed", "confirmed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: params.id },
    include: { venue: true },
  });

  if (!agendamento) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  // Client can only cancel their own
  if (session.user.role === "client") {
    if (agendamento.clientId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
    if (status !== "cancelled") {
      return NextResponse.json({ error: "Clientes só podem cancelar." }, { status: 403 });
    }
  }

  // Owner can manage their venue's appointments
  if (session.user.role === "owner") {
    const venue = await prisma.venue.findUnique({ where: { ownerId: session.user.id } });
    if (!venue || agendamento.venueId !== venue.id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
  }

  const updated = await prisma.agendamento.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json(updated);
}
