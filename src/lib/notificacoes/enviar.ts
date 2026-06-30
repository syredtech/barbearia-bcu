import { registarTentativa, jaFoiEnviado } from "./log";
import { enviarViaMetaCloudAPI, ErroMetaNumeroSemWhatsApp } from "./meta";
import { enviarViaAndroidGateway } from "./androidGateway";

export interface DadosReserva {
  salao: string;
  data: string;
  hora: string;
}

export async function enviarNotificacaoHibrida({
  reservaId,
  numeroCliente,
  dadosReserva,
  tipoNotificacao = "confirmacao_reserva",
}: {
  reservaId: string;
  numeroCliente: string;
  dadosReserva: DadosReserva;
  tipoNotificacao?: string;
}): Promise<{ canal: string }> {
  const idempotencyKey = `${reservaId}:${tipoNotificacao}`;

  const jaEnviado = await jaFoiEnviado(idempotencyKey);
  if (jaEnviado) return { canal: jaEnviado.canal };

  // 1. Tentativa WhatsApp
  try {
    const resultado = await enviarViaMetaCloudAPI({ numeroCliente, dadosReserva, tipoNotificacao });
    await registarTentativa({ idempotencyKey, reservaId, numeroCliente, canal: "whatsapp", sucesso: true, detalhe: resultado });
    return { canal: "whatsapp" };
  } catch (erro) {
    await registarTentativa({
      idempotencyKey,
      reservaId,
      numeroCliente,
      canal: "whatsapp",
      sucesso: false,
      detalhe: (erro as { detalheOriginal?: unknown }).detalheOriginal ?? (erro as Error).message,
    });

    // Só avança para SMS se o número não tiver WhatsApp
    if (!(erro instanceof ErroMetaNumeroSemWhatsApp)) throw erro;
  }

  // 2. Fallback SMS Gateway
  const mensagem = `BCU: marcação confirmada no "${dadosReserva.salao}" para ${dadosReserva.data} às ${dadosReserva.hora}.`;
  try {
    const resultado = await enviarViaAndroidGateway({ numeroCliente, mensagem });
    await registarTentativa({ idempotencyKey, reservaId, numeroCliente, canal: "sms_gateway", sucesso: true, detalhe: resultado });
    return { canal: "sms_gateway" };
  } catch (erroSms) {
    await registarTentativa({
      idempotencyKey,
      reservaId,
      numeroCliente,
      canal: "sms_gateway",
      sucesso: false,
      detalhe: (erroSms as Error).message,
    });
    throw erroSms;
  }
}
