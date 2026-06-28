import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!(await rateLimit(`admin:venues-list:${session.user.id}`, 120, 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const raw = searchParams.get("status");
  const allowed = ["pending", "approved", "rejected"];
  const status = raw && allowed.includes(raw) ? raw : "pending";
  const page = Math.min(Math.max(0, parseInt(searchParams.get("page") ?? "0")), 1000);
  const take = 100;
  const skip = page * take;

  const venues = await prisma.venue.findMany({
    where: { status },
    select: {
      id: true, name: true, category: true,
      status: true, subscriptionStatus: true, subscriptionExpiresAt: true, createdAt: true,
      owner: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return NextResponse.json(venues);
}
