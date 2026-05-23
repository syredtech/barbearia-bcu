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
    include: { servicos: { select: { id: true, price: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(venues);
}
