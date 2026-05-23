import { chromium } from "playwright";

const BASE = "http://localhost:3004";
const browser = await chromium.launch({ headless: false, slowMo: 150 });

// Two contexts: guest (no login) + owner (to verify notification)
const ctxGuest = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const ctxOwner = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const pgGuest  = await ctxGuest.newPage();
const pgOwner  = await ctxOwner.newPage();

pgGuest.on("pageerror", e => { if (!e.message.includes("hydrat")) console.log("GUEST ERR:", e.message.slice(0,80)); });
pgOwner.on("pageerror", e => { if (!e.message.includes("hydrat")) console.log("OWNER ERR:", e.message.slice(0,80)); });

// ════════════════════════════════════════════════════════════════
// 1 — Proprietário faz login e verifica agenda antes
// ════════════════════════════════════════════════════════════════
console.log("\n[1] Proprietário faz login...");
await pgOwner.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await pgOwner.fill("input[type=email]",    "joao@barbearia.cv");
await pgOwner.fill("input[type=password]", "senha123");
await pgOwner.click("button[type=submit]");
await pgOwner.waitForURL(`${BASE}/`, { timeout: 10000 }).catch(() => {});
await pgOwner.waitForTimeout(600);
console.log("  URL:", pgOwner.url());

await pgOwner.goto(`${BASE}/painel/agenda`, { waitUntil: "networkidle" });
await pgOwner.waitForTimeout(1500);
const bellAntes = await pgOwner.locator("span.bg-ink.text-white.rounded-full").first().innerText().catch(() => "0");
const confAntes = await pgOwner.locator("span:has-text('Confirmado')").count();
console.log("  Badge notif antes:", bellAntes, "| Confirmados:", confAntes);
await pgOwner.screenshot({ path: "guest-01-agenda-antes.png" });

// ════════════════════════════════════════════════════════════════
// 2 — Convidado navega directo ao estabelecimento (sem login)
// ════════════════════════════════════════════════════════════════
console.log("\n[2] Convidado abre a página do estabelecimento...");
await pgGuest.goto(`${BASE}/estabelecimentos/barbearia-do-joao-praia`, { waitUntil: "networkidle" });
const venueH1 = await pgGuest.locator("h1").first().innerText().catch(() => "");
const agendarBtns = pgGuest.locator("a[href*='/agendar/']");
const nBtns = await agendarBtns.count();
console.log("  Venue:", venueH1.trim(), "| Botões agendar:", nBtns);
await pgGuest.screenshot({ path: "guest-02-venue.png" });

if (nBtns === 0) { console.log("  ERRO: sem botões de agendar"); await browser.close(); process.exit(1); }

const agendarHref = await agendarBtns.first().getAttribute("href");
console.log("  Href:", agendarHref);

// ════════════════════════════════════════════════════════════════
// 3 — Abre página de agendamento
// ════════════════════════════════════════════════════════════════
console.log("\n[3] Abre página de agendamento...");
await pgGuest.goto(BASE + agendarHref, { waitUntil: "networkidle" });
await pgGuest.waitForTimeout(1200);
console.log("  URL:", pgGuest.url());
await pgGuest.screenshot({ path: "guest-03-step1.png" });

// ════════════════════════════════════════════════════════════════
// 4 — Step 1: clica no serviço
// ════════════════════════════════════════════════════════════════
console.log("\n[4] Step 1 — selecciona serviço...");
const servicoCards = pgGuest.locator("button.w-full.text-left.border.rounded-card");
const nCards = await servicoCards.count();
console.log("  Cards de serviço:", nCards);

if (nCards === 0) {
  await pgGuest.waitForSelector("button.w-full", { timeout: 6000 }).catch(() => {});
  await pgGuest.locator("button.w-full").first().click();
} else {
  const nome = await servicoCards.first().locator("p").first().innerText().catch(() => "?");
  console.log("  Serviço:", nome.trim());
  await servicoCards.first().click();
}
await pgGuest.waitForTimeout(600);
await pgGuest.screenshot({ path: "guest-04-step2-data.png" });

// ════════════════════════════════════════════════════════════════
// 5 — Step 2: preenche data
// ════════════════════════════════════════════════════════════════
console.log("\n[5] Step 2 — preenche data...");
const dateInput = pgGuest.locator("input[type=date]");
const hasDate = await dateInput.count() > 0;
console.log("  Input de data:", hasDate);

if (hasDate) {
  const today = new Date().toISOString().split("T")[0];
  await dateInput.fill(today);
  console.log("  Data:", today);
  await pgGuest.waitForTimeout(300);
  await pgGuest.locator("button:has-text('Próximo')").click();
  await pgGuest.waitForTimeout(1500);
} else {
  console.log("  AVISO: input de data não encontrado");
  await pgGuest.screenshot({ path: "guest-05-debug.png", fullPage: true });
}
await pgGuest.screenshot({ path: "guest-05-step3-horarios.png" });

// ════════════════════════════════════════════════════════════════
// 6 — Step 3: selecciona horário
// ════════════════════════════════════════════════════════════════
console.log("\n[6] Step 3 — selecciona horário...");
const slots = pgGuest.locator("div.grid.grid-cols-4 button");
const nSlots = await slots.count();
console.log("  Slots disponíveis:", nSlots);

if (nSlots === 0) {
  console.log("  Sem horários disponíveis hoje — usando 2026-06-02");
  // Try a future date
  await pgGuest.locator("button:has-text('Voltar')").click();
  await pgGuest.waitForTimeout(400);
  const di2 = pgGuest.locator("input[type=date]");
  await di2.fill("2026-06-02");
  await pgGuest.waitForTimeout(300);
  await pgGuest.locator("button:has-text('Próximo')").click();
  await pgGuest.waitForTimeout(1500);
  const slots2 = pgGuest.locator("div.grid.grid-cols-4 button");
  const n2 = await slots2.count();
  console.log("  Slots em 2026-06-02:", n2);
  if (n2 > 0) { await slots2.first().click(); await pgGuest.waitForTimeout(400); }
  await pgGuest.screenshot({ path: "guest-06-horario-alt.png" });
} else {
  const slotLabel = await slots.first().innerText();
  console.log("  Horário escolhido:", slotLabel.trim());
  await slots.first().click();
  await pgGuest.waitForTimeout(600);
  await pgGuest.screenshot({ path: "guest-06-horario-selecionado.png" });
}

// ════════════════════════════════════════════════════════════════
// 7 — Formulário de convidado (nome + telefone) aparece?
// ════════════════════════════════════════════════════════════════
console.log("\n[7] Verifica formulário de convidado...");
await pgGuest.screenshot({ path: "guest-07-form-convidado.png", fullPage: true });

const nameInput  = pgGuest.locator("input[placeholder='Nome completo']");
const phoneInput = pgGuest.locator("input[placeholder='Número de telefone']");
const hasName  = await nameInput.count() > 0;
const hasPhone = await phoneInput.count() > 0;
console.log("  Campo nome:", hasName ? "✅ visível" : "❌ ausente");
console.log("  Campo telefone:", hasPhone ? "✅ visível" : "❌ ausente");

if (!hasName || !hasPhone) {
  console.log("  ERRO: formulário de convidado não apareceu");
  await pgGuest.screenshot({ path: "guest-07-debug.png", fullPage: true });
  await browser.close();
  process.exit(1);
}

await nameInput.fill("Zé Convidado");
await phoneInput.fill("9911234");
console.log("  Dados preenchidos: Zé Convidado / 9911234");
await pgGuest.waitForTimeout(400);
await pgGuest.screenshot({ path: "guest-07-form-preenchido.png", fullPage: true });

// ════════════════════════════════════════════════════════════════
// 8 — Botão "Finalizar agendamento"
// ════════════════════════════════════════════════════════════════
console.log("\n[8] Clica 'Finalizar agendamento'...");
const finalizarBtn = pgGuest.locator("button:has-text('Finalizar agendamento')");
const hasBtn = await finalizarBtn.count() > 0;
console.log("  Botão 'Finalizar agendamento':", hasBtn ? "✅" : "❌");

if (!hasBtn) {
  const allBtns = await pgGuest.locator("button").allInnerTexts();
  console.log("  Botões disponíveis:", allBtns.join(" | "));
  await browser.close();
  process.exit(1);
}

await finalizarBtn.click();
await pgGuest.waitForTimeout(3000);

const doneH1   = await pgGuest.locator("h1:has-text('confirmado')").count();
const doneCheck = await pgGuest.locator("text=✓").count();
console.log("  Ecrã de confirmação:", doneH1 > 0 || doneCheck > 0 ? "✅ SIM" : "❌ NÃO");
await pgGuest.screenshot({ path: "guest-08-confirmacao.png", fullPage: true });

// Verifica que NÃO aparece "Ver meus agendamentos" (botão só para users com conta)
const verBtn = await pgGuest.locator("a:has-text('Ver meus agendamentos')").count();
console.log("  Link 'Ver meus agendamentos' ausente:", verBtn === 0 ? "✅ correcto" : "❌ apareceu indevidamente");

// ════════════════════════════════════════════════════════════════
// 9 — Proprietário verifica notificação
// ════════════════════════════════════════════════════════════════
console.log("\n[9] Proprietário verifica notificação...");
await pgOwner.goto(`${BASE}/painel/agenda`, { waitUntil: "networkidle" });
await pgOwner.waitForTimeout(1500);

const bellDepois = await pgOwner.locator("span.bg-ink.text-white.rounded-full").first().innerText().catch(() => "0");
console.log("  Badge notif depois:", bellDepois);
await pgOwner.screenshot({ path: "guest-09-badge.png" });

// Abre o dropdown de notificações
const bell = pgOwner.locator("button[aria-label='Notificações']");
if (await bell.count() > 0) {
  await bell.click();
  await pgOwner.waitForTimeout(900);
  const liTexts = await pgOwner.locator("li").allInnerTexts();
  console.log("  Notificações:");
  liTexts.slice(0, 3).forEach(t => console.log("   •", t.trim().replace(/\s+/g, " ").slice(0, 100)));
  await pgOwner.screenshot({ path: "guest-10-notif.png" });
  await pgOwner.keyboard.press("Escape");
  await pgOwner.waitForTimeout(400);
}

// Agenda: slots confirmados
const confDepois = await pgOwner.locator("span:has-text('Confirmado')").count();
console.log("  Confirmados na agenda:", confDepois);
await pgOwner.screenshot({ path: "guest-11-agenda-depois.png" });

await browser.close();
console.log("\n✅ FLUXO DE CONVIDADO TESTADO");
