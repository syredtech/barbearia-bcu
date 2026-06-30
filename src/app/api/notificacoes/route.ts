/**
 * POST /api/notificacoes
 *
 * FLUXO:
 * 1. Verifica idempotência (evita reenvios duplicados da mesma reserva).
 * 2. Tenta WhatsApp via Meta Cloud API.
 * 3. Se o erro for especificamente "sem WhatsApp" (code 131026/131053),
 *    aciona o SMS Gateway Android como fallback.
 * 4. Outros erros técnicos (token, rate limit, template) são devolvidos
 *    como 502 sem consumir o canal de SMS.
 * 5. Regista cada tentativa (canal, sucesso/falha) na tabela NotificacaoLog.
 */

import { NextResponse } from "next/server";
import { registarTentativa, jaFoiEnviado } from "@/lib/notificacoes/log";
import { enviarViaMetaCloudAPI, ErroMetaNumeroSemWhatsApp } from "@/lib/notificacoes/meta";
import { enviarViaAndroidGateway } from "@/lib/notificacoes/androidGateway";

interface DadosReserva {
  salao: string;
  data: string;
  hora: string;
}

interface NotificacaoBody {
  reservaId?: string;
  numeroCliente?: string;
  dadosReserva?: DadosReserva;
  tipoNotificacao?: string;
}

export async function POST(request: Request) {
  let body: NotificacaoBody;
  try {
    body = (await request.json()) as NotificacaoBody;
  } catch {
    return NextResponse.json({ success: false, erro: "JSON inválido" }, { status: 400 });
  }

  const { reservaId, numeroCliente, dadosReserva, tipoNotificacao = "confirmacao_reserva" } = body;

  if (!reservaId || !numeroCliente || !dadosReserva) {
    return NextResponse.json(
      { success: false, erro: "Campos obrigatórios em falta: reservaId, numeroCliente, dadosReserva" },
      { status: 400 }
    );
  }

  // 1. Idempotência
  const idempotencyKey = `${reservaId}:${tipoNotificacao}`;
  const jaEnviado = await jaFoiEnviado(idempotencyKey);

  if (jaEnviado) {
    return NextResponse.json({
      success: true,
      canal: jaEnviado.canal,
      info: "Notificação já tinha sido enviada anteriormente (idempotência aplicada).",
    });
  }

  // 2. Tentativa via WhatsApp
  try {
    const resultadoMeta = await enviarViaMetaCloudAPI({ numeroCliente, dadosReserva, tipoNotificacao });

    await registarTentativa({ idempotencyKey, reservaId, numeroCliente, canal: "whatsapp", sucesso: true, detalhe: resultadoMeta });

    return NextResponse.json({ success: true, canal: "whatsapp" });
  } catch (erro) {
    await registarTentativa({
      idempotencyKey,
      reservaId,
      numeroCliente,
      canal: "whatsapp",
      sucesso: false,
      detalhe: (erro as { detalheOriginal?: unknown }).detalheOriginal ?? (erro as Error).message,
    });

    // Só avança para SMS se o número realmente não tiver WhatsApp.
    // Erros técnicos (token, rate limit, template) devolvem 502 sem gastar SMS.
    if (!(erro instanceof ErroMetaNumeroSemWhatsApp)) {
      return NextResponse.json(
        { success: false, canal: "whatsapp", erro: "Falha técnica no envio via WhatsApp. Ver logs para detalhe." },
        { status: 502 }
      );
    }
  }

  // 3. Fallback: SMS via Android Gateway
  try {
    const resultadoSms = await enviarViaAndroidGateway({
      numeroCliente,
      mensagem: montarMensagemSms(dadosReserva),
    });

    await registarTentativa({ idempotencyKey, reservaId, numeroCliente, canal: "sms_gateway", sucesso: true, detalhe: resultadoSms });

    return NextResponse.json({ success: true, canal: "sms_gateway" });
  } catch (erroSms) {
    await registarTentativa({
      idempotencyKey,
      reservaId,
      numeroCliente,
      canal: "sms_gateway",
      sucesso: false,
      detalhe: (erroSms as Error).message,
    });

    return NextResponse.json(
      { success: false, erro: "Falha em ambos os canais (WhatsApp e SMS). Notificação não entregue." },
      { status: 500 }
    );
  }
}

function montarMensagemSms(dadosReserva: DadosReserva): string {
  return `Bela&Belo: a sua marcação no salão "${dadosReserva.salao}" está confirmada para ${dadosReserva.data} às ${dadosReserva.hora}.`;
}
