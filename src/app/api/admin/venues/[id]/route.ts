import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { status } = await req.json();
  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  try {
    const venue = await prisma.venue.update({
      where: { id: params.id },
      data: { status },
      select: { id: true, name: true, status: true, updatedAt: true },
    });
    return NextResponse.json(venue);
  } catch {
    return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });
  }
}
