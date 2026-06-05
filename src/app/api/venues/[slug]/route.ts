import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const venue = await prisma.venue.findUnique({
    where: {
      slug: params.slug,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionExpiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      address: true,
      phone: true,
      imageUrl: true,
      servicos: { select: { id: true, name: true, duration: true, price: true } },
    },
  });

  if (!venue) {
    return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });
  }

  return NextResponse.json(venue);
}
