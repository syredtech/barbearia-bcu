const MONTHS   = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const WEEKDAYS = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

function normalizePhone(phone: string): string {
  const s = phone.replace(/\s/g, "");
  if (s.startsWith("+")) return s;
  if (s.startsWith("238")) return "+" + s;
  return "+238" + s;
}

export async function enviarConfirmacao({
  phone,
  venueName,
  date,
  horario,
  servicoName,
}: {
  phone: string;
  venueName: string;
  date: string;
  horario: string;
  servicoName: string;
}): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const from       = process.env.TWILIO_SMS_FROM;

  if (!accountSid || !authToken || !from) {
    console.warn("[mensagem] Twilio não configurado — envio de SMS/WhatsApp desativado");
    return;
  }

  const body =
    `Agendamento confirmado!\n\n` +
    `${venueName}\n` +
    `${formatDate(date)} as ${horario}\n` +
    `${servicoName}\n\n` +
    `Obrigado pela marcacao!`;

  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: normalizePhone(phone), Body: body }).toString(),
    },
  );
}
