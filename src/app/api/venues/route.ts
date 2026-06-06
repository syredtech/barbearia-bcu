import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await rateLimit(`venues-list:${ip}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }
  const page = Math.min(Math.max(0, parseInt(req.nextUrl.searchParams.get("page") ?? "0")), 100);
  const take = 20;
  const skip = page * take;

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
    take,
    skip,
  });
  return NextResponse.json(venues);
}
