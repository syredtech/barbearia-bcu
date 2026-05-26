import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { imageUrl, description, address, phone } = await req.json();

  const venue = await prisma.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });

  const updated = await prisma.venue.update({
    where: { id: venue.id },
    data: {
      imageUrl: imageUrl || null,
      description: description || null,
      address: address || null,
      phone: phone || null,
    },
  });

  return NextResponse.json({ ok: true, venue: updated });
}
