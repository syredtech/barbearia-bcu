import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await rateLimit(`reviews-get:${ip}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  const venueId = req.nextUrl.searchParams.get("venueId");
  if (!venueId || typeof venueId !== "string" || venueId.length > 100) return NextResponse.json([], { status: 200 });

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

  if (!(await rateLimit(`reviews:user:${session.user.id}`, 20, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedBody: any;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { agendamentoId, rating, comment } = parsedBody;

  if (!agendamentoId || typeof agendamentoId !== "string" || typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  if (comment && (typeof comment !== "string" || comment.length > 500)) {
    return NextResponse.json({ error: "Comentário inválido (máx. 500 caracteres)." }, { status: 400 });
  }
  if (comment && /[<>]/.test(comment)) {
    return NextResponse.json({ error: "Comentário contém caracteres inválidos." }, { status: 400 });
  }

  // Verify the appointment belongs to this client
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    select: { clientId: true, venueId: true, status: true, date: true, horario: true },
  });
  if (!agendamento || agendamento.clientId !== session.user.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  if (agendamento.status !== "completed") {
    return NextResponse.json({ error: "Só é possível avaliar serviços concluídos." }, { status: 400 });
  }

  const apptTime = new Date(`${agendamento.date}T${agendamento.horario}:00`);
  if (apptTime > new Date()) {
    return NextResponse.json({ error: "Só é possível avaliar após a data do serviço." }, { status: 400 });
  }

  const existingReview = await prisma.review.findUnique({ where: { agendamentoId }, select: { id: true } });
  if (existingReview) {
    return NextResponse.json({ error: "Já avaliou este serviço." }, { status: 409 });
  }

  let review;
  try {
    review = await prisma.review.create({
      data: {
        agendamentoId,
        venueId: agendamento.venueId,
        rating,
        comment: comment?.trim() || null,
        clientId: session.user.id,
      },
      select: { id: true, rating: true, comment: true, createdAt: true },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Já avaliou este serviço." }, { status: 409 });
    }
    console.error("[reviews] Erro ao criar review:", err);
    return NextResponse.json({ error: "Erro ao processar avaliação." }, { status: 500 });
  }

  return NextResponse.json(review, { status: 201 });
}
