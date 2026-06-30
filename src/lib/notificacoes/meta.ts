/**
 * Encapsula o envio via Meta Cloud API (WhatsApp) e distingue
 * "número sem WhatsApp" de outras falhas técnicas.
 *
 * Códigos de erro relevantes da Meta (confirmar na docs oficial):
 *   131026 / 131053 — mensagem não entregável (sem WhatsApp) → fallback SMS
 *   131047 — janela de 24h expirada, usar template
 *   131009 — parâmetro inválido (número mal formatado)
 *   190    — token inválido/expirado
 *   80007  — rate limit excedido
 */

const META_API_URL = `https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`;
const TIMEOUT_MS = 5000;

// Únicos códigos que ativam o fallback para SMS
const CODIGOS_FALLBACK_SMS = new Set([131026, 131053]);

export class ErroMetaNumeroSemWhatsApp extends Error {
  detalheOriginal: unknown;
  constructor(detalheOriginal: unknown) {
    super("Número sem WhatsApp ou mensagem não entregável por este canal");
    this.name = "ErroMetaNumeroSemWhatsApp";
    this.detalheOriginal = detalheOriginal;
  }
}

export class ErroMetaTecnico extends Error {
  detalheOriginal: unknown;
  constructor(message: string, detalheOriginal: unknown) {
    super(message);
    this.name = "ErroMetaTecnico";
    this.detalheOriginal = detalheOriginal;
  }
}

interface DadosReserva {
  salao: string;
  data: string;
  hora: string;
}

interface EnviarMetaParams {
  numeroCliente: string;
  dadosReserva: DadosReserva;
  tipoNotificacao: string;
}

export async function enviarViaMetaCloudAPI({ numeroCliente, dadosReserva, tipoNotificacao }: EnviarMetaParams) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(META_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizarNumero(numeroCliente),
        type: "template",
        template: {
          name: tipoNotificacao,
          language: { code: "pt_PT" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: dadosReserva.salao },
                { type: "text", text: dadosReserva.data },
                { type: "text", text: dadosReserva.hora },
              ],
            },
          ],
        },
      }),
      signal: controller.signal,
    });
  } catch (erroRede) {
    if ((erroRede as Error).name === "AbortError") {
      throw new ErroMetaTecnico("Timeout ao contactar a Meta Cloud API", (erroRede as Error).message);
    }
    throw new ErroMetaTecnico("Erro de rede ao contactar a Meta Cloud API", (erroRede as Error).message);
  } finally {
    clearTimeout(timeoutId);
  }

  const corpo = await response.json().catch(() => ({})) as { error?: { code?: number; error_subcode?: number } };

  if (response.ok) {
    return corpo;
  }

  const codigoErro = corpo?.error?.code;
  const subcodigoErro = corpo?.error?.error_subcode;

  if (codigoErro !== undefined && CODIGOS_FALLBACK_SMS.has(codigoErro)) {
    throw new ErroMetaNumeroSemWhatsApp({ codigoErro, subcodigoErro, corpo });
  }

  throw new ErroMetaTecnico(
    `Erro da Meta Cloud API (code=${codigoErro}, subcode=${subcodigoErro})`,
    corpo
  );
}

function normalizarNumero(numero: string): string {
  return numero.replace(/[^\d+]/g, "");
}
