import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (session.user.role === "owner") {
    const venue = await prisma.venue.findUnique({
      where: { ownerId: session.user.id },
    });
    if (!venue) return NextResponse.json([]);

    const agendamentos = await prisma.agendamento.findMany({
      where: { venueId: venue.id },
      include: { client: true, servico: true },
      orderBy: [{ date: "desc" }, { horario: "asc" }],
    });
    return NextResponse.json(agendamentos);
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: { clientId: session.user.id },
    include: { venue: true, servico: true },
    orderBy: [{ date: "desc" }, { horario: "asc" }],
  });
  return NextResponse.json(agendamentos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  const { venueId, servicoId, date, horario, guestName, guestPhone } = await req.json();

  if (!venueId || !servicoId || !date || !horario) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  // Guest booking requires name and phone
  if (!session && (!guestName?.trim() || !guestPhone?.trim())) {
    return NextResponse.json({ error: "Nome e telefone obrigatórios." }, { status: 400 });
  }

  const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
  if (!servico || servico.venueId !== venueId) {
    return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });
  }

  const [bookedCount, venue] = await Promise.all([
    prisma.agendamento.count({ where: { venueId, date, horario, status: "confirmed" } }),
    prisma.venue.findUnique({ where: { id: venueId }, select: { _count: { select: { funcionarios: true } } } }),
  ]);

  const capacity = Math.max(1, venue?._count.funcionarios ?? 0);
  if (bookedCount >= capacity) {
    return NextResponse.json({ error: "Horário indisponível." }, { status: 409 });
  }

  const agendamento = await prisma.agendamento.create({
    data: {
      venueId,
      servicoId,
      date,
      horario,
      status: "confirmed",
      clientId: session?.user.id ?? null,
      guestName: session ? null : guestName.trim(),
      guestPhone: session ? null : guestPhone.trim(),
    },
    include: {
      venue: { select: { ownerId: true, name: true } },
      servico: { select: { name: true } },
      client: { select: { name: true } },
    },
  });

  const clientLabel = agendamento.client?.name ?? agendamento.guestName ?? "Cliente";
  const [day, month, year] = [
    date.split("-")[2],
    ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][parseInt(date.split("-")[1]) - 1],
    date.split("-")[0],
  ];
  await prisma.notificacao.create({
    data: {
      ownerId: agendamento.venue.ownerId,
      title: "Nova marcação",
      body: `${clientLabel} · ${agendamento.servico.name} · ${day} ${month} ${year} às ${horario}`,
    },
  });

  return NextResponse.json(agendamento, { status: 201 });
}
