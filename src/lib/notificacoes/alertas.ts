export async function alertarAdmin({ assunto, mensagem }: { assunto: string; mensagem: string }) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.error("[ALERTA ADMIN - sem canal configurado]", assunto, mensagem);
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: `⚠️ ${assunto}\n\n${mensagem}` }),
    });
  } catch (erro) {
    console.error("Falha ao enviar alerta ao admin:", erro);
  }
}
