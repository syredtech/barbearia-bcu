import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const role = req.nextUrl.searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role ? { role } : { role: { not: "admin" } },
    include: {
      venue: { select: { name: true, status: true, subscriptionStatus: true } },
      _count: { select: { agendamentos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
