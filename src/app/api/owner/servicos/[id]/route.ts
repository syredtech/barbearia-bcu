import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const servico = await authorize(params.id, session.user.id);
  if (!servico) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const { name, description, duration, price } = await req.json();
  const updated = await prisma.servico.update({
    where: { id: params.id },
    data: { name, description, duration: Number(duration), price: Number(price) },
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

  const servico = await authorize(params.id, session.user.id);
  if (!servico) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  await prisma.servico.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
