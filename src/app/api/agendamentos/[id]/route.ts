import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (!(await rateLimit(`agendamentos:patch:${session.user.id}`, 20, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  let body: { status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { status } = body;
  const validStatuses = ["cancelled", "completed", "confirmed"];
  if (typeof status !== "string" || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: params.id },
    select: { id: true, clientId: true, venueId: true, date: true, horario: true, servicoId: true, status: true },
  });

  if (!agendamento) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  if (agendamento.status === "completed") {
    return NextResponse.json({ error: "Marcações concluídas não podem ser alteradas." }, { status: 400 });
  }

  // Client can only cancel their own
  if (session.user.role === "client") {
    if (agendamento.clientId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
    if (status !== "cancelled") {
      return NextResponse.json({ error: "Clientes só podem cancelar." }, { status: 403 });
    }
    if (agendamento.status !== "confirmed") {
      return NextResponse.json({ error: "Apenas marcações confirmadas podem ser canceladas." }, { status: 400 });
    }
    // Cooldown: must cancel at least 24 h before the appointment
    const apptDateTime = new Date(`${agendamento.date}T${agendamento.horario}:00`);
    if (apptDateTime > new Date()) {
      const hoursUntil = (apptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 24) {
        return NextResponse.json(
          { error: "Cancelamentos devem ser feitos com pelo menos 24 horas de antecedência." },
          { status: 400 },
        );
      }
    }
  }

  // Owner can manage their venue's appointments
  if (session.user.role === "owner") {
    const venue = await prisma.venue.findUnique({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        scheduleStart: true, scheduleEnd: true, slotDuration: true,
        breakStart: true, breakEnd: true, break2Start: true, break2End: true,
        closedDays: true,
        _count: { select: { funcionarios: true } },
      },
    });
    if (!venue || agendamento.venueId !== venue.id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
    if (status === "confirmed") {
      // Re-validate slot against current venue schedule
      const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
      const toStr = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
      const startMin = toMin(venue.scheduleStart); const endMin = toMin(venue.scheduleEnd);
      const bsMin = venue.breakStart ? toMin(venue.breakStart) : null; const beMin = venue.breakEnd ? toMin(venue.breakEnd) : null;
      const bs2Min = venue.break2Start ? toMin(venue.break2Start) : null; const be2Min = venue.break2End ? toMin(venue.break2End) : null;
      const slots: string[] = [];
      let cur = startMin;
      while (cur + venue.slotDuration <= endMin) {
        if (bsMin !== null && beMin !== null && cur >= bsMin && cur < beMin) { cur = beMin; continue; }
        if (bs2Min !== null && be2Min !== null && cur >= bs2Min && cur < be2Min) { cur = be2Min; continue; }
        slots.push(toStr(cur)); cur += venue.slotDuration;
      }
      const closedDays: number[] = (() => { try { return JSON.parse(venue.closedDays || "[]"); } catch { return []; } })();
      const weekday = new Date(agendamento.date + "T12:00:00").getDay();
      if (closedDays.includes(weekday) || !slots.includes(agendamento.horario)) {
        return NextResponse.json({ error: "Este horário não é mais válido no horário atual do estabelecimento." }, { status: 409 });
      }
      const capacity = Math.max(1, venue._count.funcionarios);
      const currentCount = await prisma.agendamento.count({
        where: { venueId: venue.id, date: agendamento.date, horario: agendamento.horario, status: "confirmed" },
      });
      if (currentCount >= capacity) {
        return NextResponse.json({ error: "Horário indisponível." }, { status: 409 });
      }
      // Verify the service still exists and belongs to this venue
      const servico = await prisma.servico.findFirst({
        where: { id: agendamento.servicoId, venueId: venue.id },
      });
      if (!servico) {
        return NextResponse.json({ error: "Serviço não encontrado ou removido." }, { status: 409 });
      }
    }
  }

  const updated = await prisma.agendamento.update({
    where: { id: params.id },
    data: { status },
    select: { id: true, status: true, date: true, horario: true, venueId: true },
  });

  return NextResponse.json(updated);
}
