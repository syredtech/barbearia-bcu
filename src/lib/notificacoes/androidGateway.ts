/**
 * Envia SMS via telemóvel Android local (fallback), exposto por túnel
 * privado (Tailscale recomendado). O endpoint é protegido por
 * GATEWAY_SECRET_TOKEN para evitar abuso do canal.
 */

const GATEWAY_URL = process.env.ANDROID_GATEWAY_URL;
const GATEWAY_TOKEN = process.env.GATEWAY_SECRET_TOKEN;
const TIMEOUT_MS = 8000;

interface AndroidGatewayParams {
  numeroCliente: string;
  mensagem: string;
}

export async function enviarViaAndroidGateway({ numeroCliente, mensagem }: AndroidGatewayParams) {
  if (!GATEWAY_URL || !GATEWAY_TOKEN) {
    throw new Error("Configuração do Android Gateway em falta (ANDROID_GATEWAY_URL ou GATEWAY_SECRET_TOKEN).");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({ to: numeroCliente, message: mensagem }),
      signal: controller.signal,
    });
  } catch (erroRede) {
    if ((erroRede as Error).name === "AbortError") {
      throw new Error("Timeout ao contactar o Android Gateway (telemóvel pode estar offline)");
    }
    throw new Error(`Erro de rede ao contactar o Android Gateway: ${(erroRede as Error).message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const corpo = await response.text().catch(() => "");
    throw new Error(`Android Gateway respondeu com erro ${response.status}: ${corpo}`);
  }

  return response.json().catch(() => ({}));
}
