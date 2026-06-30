import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { obterUltimoHeartbeat } from "@/lib/notificacoes/heartbeat";

const LIMITE_OFFLINE_MINUTOS = 10;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (!(await rateLimit(`admin:notificacoes-log:${session.user.id}`, 30, 60 * 1000)))
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });

  const [logs, agrupados, ultimoHeartbeat] = await Promise.all([
    prisma.notificacaoLog.findMany({
      orderBy: { criadoEm: "desc" },
      take: 50,
    }),
    prisma.notificacaoLog.groupBy({
      by: ["canal", "sucesso"],
      _count: { _all: true },
    }),
    obterUltimoHeartbeat(),
  ]);

  const porCanal: Record<string, { total: number; sucesso: number }> = {
    whatsapp: { total: 0, sucesso: 0 },
    sms_gateway: { total: 0, sucesso: 0 },
  };
  let total = 0;
  for (const g of agrupados) {
    if (!porCanal[g.canal]) porCanal[g.canal] = { total: 0, sucesso: 0 };
    porCanal[g.canal].total += g._count._all;
    if (g.sucesso) porCanal[g.canal].sucesso += g._count._all;
    total += g._count._all;
  }

  let minutosDesdeUltimo: number | null = null;
  let online = false;
  if (ultimoHeartbeat) {
    minutosDesdeUltimo = Math.round((Date.now() - ultimoHeartbeat.getTime()) / 60000);
    online = minutosDesdeUltimo <= LIMITE_OFFLINE_MINUTOS;
  }

  return NextResponse.json({
    logs,
    stats: { total, porCanal },
    gateway: {
      online,
      ultimoHeartbeat: ultimoHeartbeat?.toISOString() ?? null,
      minutosDesdeUltimo,
    },
  });
}
