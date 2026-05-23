import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const venue = await prisma.venue.findUnique({
    where: { slug: params.slug },
    include: { servicos: true },
  });

  if (!venue) {
    return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });
  }

  return NextResponse.json(venue);
}
