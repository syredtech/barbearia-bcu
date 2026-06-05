import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const venues = await prisma.venue.findMany({
    where: {
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
      latitude: true,
      longitude: true,
      servicos: { select: { id: true, price: true } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });
  return NextResponse.json(venues);
}
