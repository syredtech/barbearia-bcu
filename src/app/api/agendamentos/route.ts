import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";
import { enviarConfirmacao } from "@/lib/mensagem";

export const dynamic = "force-dynamic";

function generateSlots(
  start: string, end: string, duration: number,
  breakStart?: string | null, breakEnd?: string | null,
  break2Start?: string | null, break2End?: string | null,
): string[] {
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const toStr = (min: number) =>
    `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  const startMin = toMin(start), endMin = toMin(end);
  const bsMin  = breakStart  ? toMin(breakStart)  : null;
  const beMin  = breakEnd    ? toMin(breakEnd)    : null;
  const bs2Min = break2Start ? toMin(break2Start) : null;
  const be2Min = break2End   ? toMin(break2End)   : null;
  const slots: string[] = [];
  let cur = startMin;
  while (cur + duration <= endMin) {
    if (bsMin !== null && beMin !== null && cur >= bsMin && cur < beMin) { cur = beMin; continue; }
    if (bs2Min !== null && be2Min !== null && cur >= bs2Min && cur < be2Min) { cur = be2Min; continue; }
    slots.push(toStr(cur));
    cur += duration;
  }
  return slots;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (session.user.role === "owner") {
    const venue = await prisma.venue.findUnique({ where: { ownerId: session.user.id } });
    if (!venue) return NextResponse.json([]);

    const agendamentos = await prisma.agendamento.findMany({
      where: { venueId: venue.id },
      include: { client: { select: { name: true } }, servico: true },
      orderBy: [{ date: "desc" }, { horario: "asc" }],
      take: 200,
    });
    return NextResponse.json(agendamentos);
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: { clientId: session.user.id },
    include: {
      venue: { select: { id: true, slug: true, name: true, category: true, address: true, phone: true, imageUrl: true } },
      servico: true,
    },
    orderBy: [{ date: "desc" }, { horario: "asc" }],
    take: 200,
  });
  return NextResponse.json(agendamentos);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const session = await getServerSession(authOptions);

  // Rate limit by userId when authenticated, otherwise by IP
  const rateLimitKey = session ? `agendamentos:user:${session.user.id}` : `agendamentos:${ip}`;
  if (!rateLimit(rateLimitKey, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  let body: { venueId?: unknown; servicoId?: unknown; date?: unknown; horario?: unknown; guestName?: unknown; guestPhone?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { venueId, servicoId, date, horario, guestName, guestPhone } = body;

  if (!venueId || typeof venueId !== "string" || !venueId.trim()) {
    return NextResponse.json({ error: "venueId inválido." }, { status: 400 });
  }
  if (!servicoId || typeof servicoId !== "string" || !servicoId.trim()) {
    return NextResponse.json({ error: "servicoId inválido." }, { status: 400 });
  }
  if (!date || !horario) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Formato de data inválido." }, { status: 400 });
  }
  if (!/^\d{2}:\d{2}$/.test(horario)) {
    return NextResponse.json({ error: "Formato de horário inválido." }, { status: 400 });
  }
  if (new Date(date + "T00:00:00") < new Date(new Date().toISOString().split("T")[0] + "T00:00:00")) {
    return NextResponse.json({ error: "A data deve ser hoje ou futura." }, { status: 400 });
  }
  if (new Date(`${date}T${horario}:00`) <= new Date()) {
    return NextResponse.json({ error: "Este horário já passou." }, { status: 400 });
  }
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  if (date > maxDate.toISOString().split("T")[0]) {
    return NextResponse.json({ error: "Data demasiado distante (máx. 1 ano)." }, { status: 400 });
  }

  if (!session && (!guestName?.trim() || !guestPhone?.trim())) {
    return NextResponse.json({ error: "Nome e telefone obrigatórios." }, { status: 400 });
  }
  if (!session && guestPhone && !/^[0-9+\s]{7,15}$/.test(guestPhone.trim())) {
    return NextResponse.json({ error: "Formato de telefone inválido." }, { status: 400 });
  }
  if (!session && guestName && (guestName.trim().length > 100 || /[<>]/.test(guestName))) {
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  }

  const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
  if (!servico || servico.venueId !== venueId) {
    return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      status: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      scheduleStart: true, scheduleEnd: true, slotDuration: true,
      breakStart: true, breakEnd: true, break2Start: true, break2End: true,
      closedDays: true,
      _count: { select: { funcionarios: true } },
    },
  });

  if (
    !venue ||
    venue.status !== "approved" ||
    venue.subscriptionStatus !== "active" ||
    !venue.subscriptionExpiresAt ||
    venue.subscriptionExpiresAt < new Date()
  ) {
    return NextResponse.json({ error: "Estabelecimento não disponível." }, { status: 404 });
  }

  const closedDays: number[] = (() => { try { return JSON.parse(venue.closedDays || "[]"); } catch { return []; } })();
  const weekday = new Date(date + "T12:00:00").getDay();
  if (closedDays.includes(weekday)) {
    return NextResponse.json({ error: "Estabelecimento encerrado neste dia." }, { status: 400 });
  }

  const validSlots = generateSlots(
    venue.scheduleStart, venue.scheduleEnd, venue.slotDuration,
    venue.breakStart, venue.breakEnd, venue.break2Start, venue.break2End,
  );
  if (!validSlots.includes(horario)) {
    return NextResponse.json({ error: "Horário inválido para este estabelecimento." }, { status: 400 });
  }

  const capacity = Math.max(1, venue._count.funcionarios);

  let agendamento;
  try {
    agendamento = await prisma.$transaction(async (tx) => {
      const currentCount = await tx.agendamento.count({
        where: { venueId, date, horario, status: "confirmed" },
      });
      if (currentCount >= capacity) throw new Error("SLOT_TAKEN");
      return tx.agendamento.create({
        data: {
          venueId,
          servicoId,
          date,
          horario,
          status: "confirmed",
          clientId: session?.user.id ?? null,
          guestName: session ? null : guestName.trim(),
          guestPhone: session ? null : guestPhone.trim(),
        },
        include: {
          venue: { select: { ownerId: true, name: true } },
          servico: { select: { name: true } },
          client: { select: { name: true } },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "Horário indisponível." }, { status: 409 });
    }
    throw err;
  }

  if (agendamento.guestPhone) {
    enviarConfirmacao({
      phone: agendamento.guestPhone,
      venueName: agendamento.venue.name,
      date: agendamento.date,
      horario: agendamento.horario,
      servicoName: agendamento.servico.name,
    }).catch((err) => { console.error("[mensagem] Falha ao enviar confirmação:", err); });
  }

  const clientLabel = (agendamento.client?.name ?? agendamento.guestName ?? "Cliente").slice(0, 100);
  const [day, month, year] = [
    date.split("-")[2],
    ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][parseInt(date.split("-")[1]) - 1],
    date.split("-")[0],
  ];
  await prisma.notificacao.create({
    data: {
      ownerId: agendamento.venue.ownerId,
      title: "Nova marcação",
      body: `${clientLabel} · ${agendamento.servico.name} · ${day} ${month} ${year} às ${horario}`,
    },
  });

  return NextResponse.json(agendamento, { status: 201 });
}
