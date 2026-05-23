import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getVenue(ownerId: string) {
  return prisma.venue.findUnique({ where: { ownerId } });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const venue = await getVenue(session.user.id);
  if (!venue) return NextResponse.json([]);

  const servicos = await prisma.servico.findMany({
    where: { venueId: venue.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(servicos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const venue = await getVenue(session.user.id);
  if (!venue) return NextResponse.json({ error: "Venue não encontrado." }, { status: 404 });

  const { name, description, duration, price } = await req.json();
  if (!name || !duration || price === undefined) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const servico = await prisma.servico.create({
    data: { name, description, duration: Number(duration), price: Number(price), venueId: venue.id },
  });

  return NextResponse.json(servico, { status: 201 });
}
