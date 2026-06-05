import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const venueId = req.nextUrl.searchParams.get("venueId");
  if (!venueId) return NextResponse.json([], { status: 200 });

  const reviews = await prisma.review.findMany({
    where: { venueId },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (!rateLimit(`reviews:user:${session.user.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedBody: any;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { agendamentoId, venueId, rating, comment } = parsedBody;

  if (!agendamentoId || !venueId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  if (comment && (typeof comment !== "string" || comment.length > 500)) {
    return NextResponse.json({ error: "Comentário inválido (máx. 500 caracteres)." }, { status: 400 });
  }
  if (comment && /[<>]/.test(comment)) {
    return NextResponse.json({ error: "Comentário contém caracteres inválidos." }, { status: 400 });
  }

  // Verify the appointment belongs to this client
  const agendamento = await prisma.agendamento.findUnique({ where: { id: agendamentoId } });
  if (!agendamento || agendamento.clientId !== session.user.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  if (agendamento.status === "cancelled") {
    return NextResponse.json({ error: "Não é possível avaliar um agendamento cancelado." }, { status: 400 });
  }

  const apptTime = new Date(`${agendamento.date}T${agendamento.horario}:00`);
  if (apptTime > new Date()) {
    return NextResponse.json({ error: "Só é possível avaliar após a data do serviço." }, { status: 400 });
  }

  const existingReview = await prisma.review.findUnique({ where: { agendamentoId } });
  if (existingReview) {
    return NextResponse.json({ error: "Já avaliou este serviço." }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      agendamentoId,
      venueId,
      rating,
      comment: comment?.trim() || null,
      clientId: session.user.id,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
