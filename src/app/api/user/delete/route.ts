import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (!(await rateLimit(`delete-account:${session.user.id}`, 3, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    if (session.user.role === "owner") {
      const venue = await tx.venue.findUnique({ where: { ownerId: userId }, select: { id: true } });
      if (venue) {
        // Delete reviews first (FK on agendamento prevents agendamento deletion otherwise)
        await tx.review.deleteMany({ where: { venueId: venue.id } });
        // Delete agendamentos (unblocks servico cascade from venue delete)
        await tx.agendamento.deleteMany({ where: { venueId: venue.id } });
        // Delete venue (cascades: Servico, Funcionario)
        await tx.venue.delete({ where: { id: venue.id } });
      }
    }

    // Reviews written by this user at other venues
    await tx.review.deleteMany({ where: { clientId: userId } });
    // Anonymise bookings made by this user at other venues
    await tx.agendamento.updateMany({ where: { clientId: userId }, data: { clientId: null } });
    // Delete user — cascades Account, Session, Notificacao
    await tx.user.delete({ where: { id: userId } });
  });

  return NextResponse.json({ ok: true });
}
