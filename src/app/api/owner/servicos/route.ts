import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

async function getVenue(ownerId: string) {
  return prisma.venue.findUnique({ where: { ownerId } });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!rateLimit(`owner:servicos-get:${session.user.id}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  const venue = await getVenue(session.user.id);
  if (!venue) return NextResponse.json([]);

  const servicos = await prisma.servico.findMany({
    where: { venueId: venue.id },
    orderBy: { name: "asc" },
    take: 200,
  });

  return NextResponse.json(servicos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!rateLimit(`owner:servicos:${session.user.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const venue = await getVenue(session.user.id);
  if (!venue) return NextResponse.json({ error: "Venue não encontrado." }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedBody: any;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { name, description, duration, price } = parsedBody;
  if (!name || !duration || price === undefined) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }
  if (typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
    return NextResponse.json({ error: "Nome inválido (máx. 100 caracteres)." }, { status: 400 });
  }
  if (/[<>]/.test(name)) {
    return NextResponse.json({ error: "Nome contém caracteres inválidos." }, { status: 400 });
  }
  if (description && description.length > 500) {
    return NextResponse.json({ error: "Descrição inválida (máx. 500 caracteres)." }, { status: 400 });
  }
  const durNum = Number(duration);
  const priceNum = Number(price);
  if (isNaN(durNum) || !Number.isInteger(durNum) || durNum < 5 || durNum > 480) {
    return NextResponse.json({ error: "Duração inválida (5–480 min, inteiro)." }, { status: 400 });
  }
  if (isNaN(priceNum) || priceNum < 1 || priceNum > 1000000) {
    return NextResponse.json({ error: "Preço inválido (mínimo 1 ECV)." }, { status: 400 });
  }

  const servicoCount = await prisma.servico.count({ where: { venueId: venue.id } });
  if (servicoCount >= 100) {
    return NextResponse.json({ error: "Limite de 100 serviços atingido." }, { status: 409 });
  }

  const servico = await prisma.servico.create({
    data: { name: name.trim(), description: description?.trim() || null, duration: durNum, price: priceNum, venueId: venue.id },
  });

  return NextResponse.json(servico, { status: 201 });
}
