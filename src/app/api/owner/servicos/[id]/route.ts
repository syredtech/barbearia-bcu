import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

async function authorize(servicoId: string, ownerId: string) {
  const servico = await prisma.servico.findUnique({
    where: { id: servicoId },
    include: { venue: true },
  });
  if (!servico || servico.venue.ownerId !== ownerId) return null;
  return servico;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!rateLimit(`owner:servicos:${session.user.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const servico = await authorize(params.id, session.user.id);
  if (!servico) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedBody: any;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { name, description, duration, price } = parsedBody;

  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
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

  const updated = await prisma.servico.update({
    where: { id: params.id },
    data: { name: name.trim(), description: description?.trim() || null, duration: durNum, price: priceNum },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!rateLimit(`owner:servicos:${session.user.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const servico = await authorize(params.id, session.user.id);
  if (!servico) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  await prisma.servico.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
