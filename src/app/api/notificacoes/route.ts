import { NextResponse } from "next/server";
import { enviarNotificacaoHibrida } from "@/lib/notificacoes/enviar";

interface NotificacaoBody {
  reservaId?: string;
  numeroCliente?: string;
  dadosReserva?: { salao: string; data: string; hora: string };
  tipoNotificacao?: string;
}

export async function POST(request: Request) {
  let body: NotificacaoBody;
  try {
    body = (await request.json()) as NotificacaoBody;
  } catch {
    return NextResponse.json({ success: false, erro: "JSON inválido" }, { status: 400 });
  }

  const { reservaId, numeroCliente, dadosReserva, tipoNotificacao } = body;

  if (!reservaId || !numeroCliente || !dadosReserva) {
    return NextResponse.json(
      { success: false, erro: "Campos obrigatórios em falta: reservaId, numeroCliente, dadosReserva" },
      { status: 400 }
    );
  }

  try {
    const { canal } = await enviarNotificacaoHibrida({ reservaId, numeroCliente, dadosReserva, tipoNotificacao });
    return NextResponse.json({ success: true, canal });
  } catch (erro) {
    const msg = (erro as Error).message ?? "Erro desconhecido";
    const status = msg.includes("WhatsApp") ? 502 : 500;
    return NextResponse.json({ success: false, erro: msg }, { status });
  }
}
