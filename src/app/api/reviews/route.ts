import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const venueId = req.nextUrl.searchParams.get("venueId");
  if (!venueId) return NextResponse.json([], { status: 200 });

  const reviews = await prisma.review.findMany({
    where: { venueId },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { agendamentoId, venueId, rating, comment } = await req.json();

  if (!agendamentoId || !venueId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Verify the appointment belongs to this client
  const agendamento = await prisma.agendamento.findUnique({ where: { id: agendamentoId } });
  if (!agendamento || agendamento.clientId !== session.user.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const review = await prisma.review.create({
    data: {
      agendamentoId,
      venueId,
      rating,
      comment: comment || null,
      clientId: session.user.id,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
