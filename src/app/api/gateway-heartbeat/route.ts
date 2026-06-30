/**
 * GET  /api/gateway-heartbeat  — verifica estado do gateway (chamado pelo cron)
 * POST /api/gateway-heartbeat  — recebe heartbeat da app Android
 *
 * Configura um cron job (Vercel Cron ou externo) a chamar GET a cada 5-10 min.
 * A app Android deve chamar POST com Authorization: Bearer <GATEWAY_SECRET_TOKEN>
 * a cada 5 minutos.
 */

import { NextResponse } from "next/server";
import { registarHeartbeat, obterUltimoHeartbeat } from "@/lib/notificacoes/heartbeat";
import { alertarAdmin } from "@/lib/notificacoes/alertas";

const LIMITE_OFFLINE_MINUTOS = 10;

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token || token !== process.env.GATEWAY_SECRET_TOKEN) {
    return NextResponse.json({ success: false, erro: "Não autorizado" }, { status: 401 });
  }

  await registarHeartbeat();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const ultimoHeartbeat = await obterUltimoHeartbeat();

  if (!ultimoHeartbeat) {
    return NextResponse.json({ online: false, motivo: "Nunca recebeu heartbeat" });
  }

  const minutosDesdeUltimo = (Date.now() - ultimoHeartbeat.getTime()) / 60000;
  const online = minutosDesdeUltimo <= LIMITE_OFFLINE_MINUTOS;

  if (!online) {
    await alertarAdmin({
      assunto: "Android SMS Gateway offline",
      mensagem: `O telemóvel de fallback não envia heartbeat há ${Math.round(minutosDesdeUltimo)} minutos. O canal de SMS de emergência pode não estar a funcionar.`,
    });
  }

  return NextResponse.json({
    online,
    ultimoHeartbeat,
    minutosDesdeUltimo: Math.round(minutosDesdeUltimo),
  });
}
