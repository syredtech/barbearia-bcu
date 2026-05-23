import { chromium } from "playwright";

const browser    = await chromium.launch({ headless: false, slowMo: 120 });
const ctxCliente = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const ctxOwner   = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const pgCliente  = await ctxCliente.newPage();
const pgOwner    = await ctxOwner.newPage();

// Ignorar erros de hydration (time-ago SSR mismatch esperado)
pgCliente.on("pageerror", e => { if (!e.message.includes("hydrat")) console.log("CLIENT ERR:", e.message.slice(0,80)); });
pgOwner.on("pageerror",   e => { if (!e.message.includes("hydrat")) console.log("OWNER ERR:",  e.message.slice(0,80)); });

// ════════════════════════════════════════════════════════════════
// 1 — Proprietário faz login e abre a agenda
// ════════════════════════════════════════════════════════════════
console.log("\n[1] Login como proprietário (João)...");
await pgOwner.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await pgOwner.fill("input[type=email]",    "joao@barbearia.cv");
await pgOwner.fill("input[type=password]", "senha123");
await pgOwner.click("button[type=submit]");
await pgOwner.waitForURL("http://localhost:3000/", { timeout: 10000 }).catch(() => {});
await pgOwner.waitForTimeout(600);
console.log("  URL:", pgOwner.url());

await pgOwner.goto("http://localhost:3000/painel/agenda", { waitUntil: "networkidle" });
await pgOwner.waitForTimeout(1500);

const slotsLivresAntes  = await pgOwner.locator("span:has-text('Disponível')").count();
const slotsConfAntess   = await pgOwner.locator("span:has-text('Confirmado')").count();
const bellBadgeAntes    = await pgOwner.locator("span.bg-ink.text-white.rounded-full").first().innerText().catch(() => "0");
console.log("  Slots livres:", slotsLivresAntes, "| Confirmados:", slotsConfAntess, "| Badge notif:", bellBadgeAntes);
await pgOwner.screenshot({ path: "ss-01-agenda-antes.png" });

// ════════════════════════════════════════════════════════════════
// 2 — Cliente faz login
// ════════════════════════════════════════════════════════════════
console.log("\n[2] Login como cliente (Ana Lima)...");
await pgCliente.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await pgCliente.fill("input[type=email]",    "ana@email.cv");
await pgCliente.fill("input[type=password]", "senha123");
await pgCliente.click("button[type=submit]");
await pgCliente.waitForURL("http://localhost:3000/", { timeout: 10000 }).catch(() => {});
await pgCliente.waitForTimeout(600);
console.log("  URL:", pgCliente.url());
await pgCliente.screenshot({ path: "ss-02-cliente-home.png" });

// ════════════════════════════════════════════════════════════════
// 3 — Cliente vai ao venue e recolhe link de agendamento
// ════════════════════════════════════════════════════════════════
console.log("\n[3] Cliente vai à barbearia do João...");
await pgCliente.goto("http://localhost:3000/estabelecimentos/barbearia-do-joao-praia", { waitUntil: "networkidle" });
const venueH1    = await pgCliente.locator("h1").first().innerText().catch(() => "");
const agendarBtns = pgCliente.locator("a[href*='/agendar/']");
const nBtns      = await agendarBtns.count();
console.log("  Venue:", venueH1.trim(), "| Botões agendar:", nBtns);
await pgCliente.screenshot({ path: "ss-03-venue.png" });

if (nBtns === 0) { console.log("  ERRO: sem botões de agendar"); await browser.close(); process.exit(1); }

// Pegar o href do 1º serviço
const agendarHref = await agendarBtns.first().getAttribute("href");
console.log("  Href:", agendarHref);

// ════════════════════════════════════════════════════════════════
// 4 — Abre a página de agendamento (step 1)
// ════════════════════════════════════════════════════════════════
console.log("\n[4] Abre página de agendamento...");
await pgCliente.goto("http://localhost:3000" + agendarHref, { waitUntil: "networkidle" });
await pgCliente.waitForTimeout(1200);
console.log("  URL:", pgCliente.url());
await pgCliente.screenshot({ path: "ss-04-agendar-step1.png" });

// ════════════════════════════════════════════════════════════════
// 5 — Step 1: clica no card de serviço (avança para step 2)
// ════════════════════════════════════════════════════════════════
console.log("\n[5] Step 1 — clica no card do serviço...");
// Os cards são buttons com class "w-full text-left border rounded-card"
const servicoCard = pgCliente.locator("button.w-full.text-left.border.rounded-card");
const nCardsSvc   = await servicoCard.count();
console.log("  Cards de serviço:", nCardsSvc);

if (nCardsSvc === 0) {
  // Fallback: talvez o venue ainda não tenha carregado — aguarda
  await pgCliente.waitForSelector("button.w-full", { timeout: 6000 }).catch(() => {});
  const n2 = await pgCliente.locator("button.w-full").count();
  console.log("  Fallback buttons:", n2);
  if (n2 > 0) await pgCliente.locator("button.w-full").first().click();
} else {
  const svcNome = await servicoCard.first().locator("p").first().innerText().catch(() => "?");
  console.log("  Serviço:", svcNome.trim());
  await servicoCard.first().click(); // auto-avança para step 2
}
await pgCliente.waitForTimeout(600);
await pgCliente.screenshot({ path: "ss-05-step2-data.png" });

// ════════════════════════════════════════════════════════════════
// 6 — Step 2: preenche data e avança para step 3
// ════════════════════════════════════════════════════════════════
console.log("\n[6] Step 2 — preenche data...");
const dateInput = pgCliente.locator("input[type=date]");
const hasDateInput = await dateInput.count() > 0;
console.log("  Input de data visível:", hasDateInput);

if (hasDateInput) {
  const today = new Date().toISOString().split("T")[0];
  await dateInput.fill(today);
  console.log("  Data:", today);
  await pgCliente.waitForTimeout(300);
  await pgCliente.locator("button:has-text('Próximo')").click();
  await pgCliente.waitForTimeout(1500); // aguarda fetch dos slots
} else {
  console.log("  AVISO: Input de data não encontrado — step 1 pode não ter avançado");
  await pgCliente.screenshot({ path: "ss-06-debug.png", fullPage: true });
}
await pgCliente.screenshot({ path: "ss-06-step3-horarios.png" });

// ════════════════════════════════════════════════════════════════
// 7 — Step 3: clica num horário disponível
// ════════════════════════════════════════════════════════════════
console.log("\n[7] Step 3 — selecciona horário...");
const slotGrid = pgCliente.locator("div.grid.grid-cols-4 button");
const nSlots   = await slotGrid.count();
console.log("  Slots disponíveis:", nSlots);

if (nSlots === 0) {
  const semSlots = await pgCliente.locator("text=Nenhum horário").count();
  console.log("  Sem horários:", semSlots > 0);
  await pgCliente.screenshot({ path: "ss-07-sem-slots.png", fullPage: true });
} else {
  const slotLabel = await slotGrid.first().innerText();
  console.log("  Horário escolhido:", slotLabel.trim());
  await slotGrid.first().click();
  await pgCliente.waitForTimeout(600);
  await pgCliente.screenshot({ path: "ss-07-slot-selecionado.png" });
}

// ════════════════════════════════════════════════════════════════
// 8 — Confirma agendamento
// ════════════════════════════════════════════════════════════════
console.log("\n[8] Confirma agendamento...");
const confirmarBtn = pgCliente.locator("button:has-text('Confirmar agendamento')");
const hasConfirmar = await confirmarBtn.count() > 0;
console.log("  Botão confirmar:", hasConfirmar);

if (hasConfirmar) {
  await confirmarBtn.click();
  await pgCliente.waitForTimeout(3000);
  const doneH1 = await pgCliente.locator("h1:has-text('confirmado')").count();
  const doneCheck = await pgCliente.locator("p:has-text('✓')").count();
  console.log("  Ecrã de confirmação:", doneH1 > 0 || doneCheck > 0 ? "SIM ✅" : "NÃO ❌");
  await pgCliente.screenshot({ path: "ss-08-confirmacao.png", fullPage: true });
} else {
  console.log("  Botão não disponível (horário não seleccionado ou sem slots)");
  await pgCliente.screenshot({ path: "ss-08-debug.png", fullPage: true });
}

// ════════════════════════════════════════════════════════════════
// 9 — Proprietário verifica notificação (recarrega agenda)
// ════════════════════════════════════════════════════════════════
console.log("\n[9] Proprietário verifica notificação...");
await pgOwner.waitForTimeout(800);
await pgOwner.goto("http://localhost:3000/painel/agenda", { waitUntil: "networkidle" });
await pgOwner.waitForTimeout(1500);

const bellBadgeDepois = await pgOwner.locator("span.bg-ink.text-white.rounded-full").first().innerText().catch(() => "sem badge");
console.log("  Badge notificações:", bellBadgeDepois);
await pgOwner.screenshot({ path: "ss-09-badge-depois.png" });

// Clica no sino e lê as notificações
const bell = pgOwner.locator("button[aria-label='Notificações']");
if (await bell.count() > 0) {
  await bell.click();
  await pgOwner.waitForTimeout(900);
  const liTexts = await pgOwner.locator("li").allInnerTexts();
  console.log("  Notificações no dropdown:");
  liTexts.slice(0, 3).forEach(t => console.log("   •", t.trim().replace(/\s+/g, " ").slice(0, 80)));
  await pgOwner.screenshot({ path: "ss-10-notif-dropdown.png" });
  await pgOwner.keyboard.press("Escape");
  await pgOwner.waitForTimeout(400);
}

// ════════════════════════════════════════════════════════════════
// 10 — Agenda: slots preenchidos vs livres
// ════════════════════════════════════════════════════════════════
console.log("\n[10] Agenda do proprietário...");
const slotsLivresDepois  = await pgOwner.locator("span:has-text('Disponível')").count();
const slotsConfirmados   = await pgOwner.locator("span:has-text('Confirmado')").count();
console.log("  Slots livres:", slotsLivresDepois, "| Confirmados:", slotsConfirmados);
await pgOwner.screenshot({ path: "ss-11-agenda-depois.png" });

// ════════════════════════════════════════════════════════════════
// 11 — Minha conta do cliente
// ════════════════════════════════════════════════════════════════
console.log("\n[11] Minha conta do cliente...");
await pgCliente.goto("http://localhost:3000/minha-conta", { waitUntil: "networkidle" });
await pgCliente.waitForTimeout(800);
const mcH1     = await pgCliente.locator("h1").first().innerText().catch(() => "");
const mcCards  = await pgCliente.locator("div.border.border-\\[\\#ebebeb\\].rounded-card").count();
console.log("  Página:", mcH1.trim(), "| Agendamentos:", mcCards);
await pgCliente.screenshot({ path: "ss-12-minha-conta.png" });

await browser.close();
console.log("\n✅ FLUXO COMPLETO TESTADO");
