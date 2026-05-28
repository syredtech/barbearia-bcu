import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const venue = await prisma.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });

  const f = await prisma.funcionario.findUnique({ where: { id: params.id } });
  if (!f || f.venueId !== venue.id) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  await prisma.funcionario.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
