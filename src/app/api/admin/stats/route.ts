import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (!rateLimit(`admin:stats:${session.user.id}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  const hoje = new Date().toISOString().split("T")[0];

  const [
    totalVenues, pendingVenues, approvedVenues, rejectedVenues,
    totalUsers, totalOwners, totalClients,
    totalAgendamentos, agendamentosHoje,
  ] = await Promise.all([
    prisma.venue.count(),
    prisma.venue.count({ where: { status: "pending" } }),
    prisma.venue.count({ where: { status: "approved" } }),
    prisma.venue.count({ where: { status: "rejected" } }),
    prisma.user.count({ where: { role: { not: "admin" } } }),
    prisma.user.count({ where: { role: "owner" } }),
    prisma.user.count({ where: { role: "client" } }),
    prisma.agendamento.count(),
    prisma.agendamento.count({ where: { date: hoje } }),
  ]);

  return NextResponse.json({
    venues: { total: totalVenues, pending: pendingVenues, approved: approvedVenues, rejected: rejectedVenues },
    users: { total: totalUsers, owners: totalOwners, clients: totalClients },
    agendamentos: { total: totalAgendamentos, hoje: agendamentosHoje },
  });
}
