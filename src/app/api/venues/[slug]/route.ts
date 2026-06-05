import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`venues-slug:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }
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
