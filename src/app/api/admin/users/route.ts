import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const role = req.nextUrl.searchParams.get("role");
  const allowedRoles = ["owner", "client"];
  const safeRole = role && allowedRoles.includes(role) ? role : null;

  const page = Math.max(0, parseInt(req.nextUrl.searchParams.get("page") ?? "0"));
  const take = 50;
  const skip = page * take;

  const users = await prisma.user.findMany({
    where: safeRole ? { role: safeRole } : { role: { not: "admin" } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      venue: { select: { name: true, status: true, subscriptionStatus: true } },
      _count: { select: { agendamentos: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return NextResponse.json(users);
}
