import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const venue = await prisma.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });

  const funcionarios = await prisma.funcionario.findMany({
    where: { venueId: venue.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json(funcionarios);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!rateLimit(`owner:funcionarios:${session.user.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedBody: any;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { name } = parsedBody;
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  if (typeof name !== "string" || name.trim().length > 100) {
    return NextResponse.json({ error: "Nome inválido (máx. 100 caracteres)." }, { status: 400 });
  }
  if (/[<>]/.test(name)) {
    return NextResponse.json({ error: "Nome contém caracteres inválidos." }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });

  const count = await prisma.funcionario.count({ where: { venueId: venue.id } });
  if (count >= 50) {
    return NextResponse.json({ error: "Limite de 50 funcionários atingido." }, { status: 409 });
  }

  const f = await prisma.funcionario.create({
    data: { name: name.trim(), venueId: venue.id },
  });
  return NextResponse.json(f);
}
