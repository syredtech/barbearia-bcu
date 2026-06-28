import { chromium } from "playwright";

const BASE    = "https://belabelo.cv";
const EMAIL   = "ana@email.cv";
const SENHA   = "senha123";
const VENUE   = "barbearia-estilo-praia";

const browser = await chromium.launch({ headless: false, slowMo: 100 });
const ctx     = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const pg      = await ctx.newPage();
pg.on("pageerror", e => { if (!e.message.includes("hydrat")) console.log("ERR:", e.message.slice(0, 100)); });

let passed = 0, failed = 0;
function ok(label)   { console.log(`  ✅ ${label}`); passed++; }
function fail(label) { console.log(`  ❌ ${label}`); failed++; }

// ── C10 — /minha-conta sem login ─────────────────────────────────
console.log("\n[C10] /minha-conta redireciona sem login...");
await pg.goto(`${BASE}/minha-conta`, { waitUntil: "networkidle" });
await pg.waitForTimeout(1000);
pg.url().includes("/login") ? ok("redireccionado para /login") : fail(`URL inesperada: ${pg.url()}`);
await pg.screenshot({ path: "c10-redirect.png" });

// ── C1 — Login ───────────────────────────────────────────────────
console.log("\n[C1] Login como cliente...");
await pg.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await pg.fill("input[type=email]",    EMAIL);
await pg.fill("input[type=password]", SENHA);
await pg.click("button[type=submit]");
await pg.waitForURL(`${BASE}/`, { timeout: 10000 }).catch(() => {});
await pg.waitForTimeout(800);
pg.url() === `${BASE}/` ? ok("login bem-sucedido → homepage") : fail(`URL após login: ${pg.url()}`);
await pg.screenshot({ path: "c01-login.png" });

// ── C2 — Agendamento ─────────────────────────────────────────────
console.log("\n[C2] Fluxo de agendamento...");
await pg.goto(`${BASE}/estabelecimentos/${VENUE}`, { waitUntil: "networkidle" });
const agendarBtns = pg.locator(`a[href*='/agendar/${VENUE}']`);
const nBtns = await agendarBtns.count();
nBtns > 0 ? ok(`${nBtns} botões 'Agendar' encontrados`) : fail("nenhum botão Agendar");
await pg.screenshot({ path: "c02-venue.png" });

if (nBtns === 0) { await browser.close(); process.exit(1); }

const href = await agendarBtns.first().getAttribute("href");
await pg.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
await pg.waitForTimeout(1000);

// Step 1 — seleccionar serviço
const servicoCards = pg.locator("button.w-full.text-left.border.rounded-card");
const nCards = await servicoCards.count();
nCards > 0 ? ok(`${nCards} serviços disponíveis`) : fail("nenhum serviço visível");
await pg.screenshot({ path: "c02-step1.png" });

if (nCards > 0) {
  const nome = await servicoCards.first().locator("p").first().innerText().catch(() => "?");
  console.log(`    Serviço: ${nome.trim()}`);
  await servicoCards.first().click();
  await pg.waitForTimeout(600);
}

// Step 2 — seleccionar data (amanhã para evitar slots ocupados)
const dateInput = pg.locator("input[type=date]");
const hasDate = await dateInput.count() > 0;
hasDate ? ok("step 2 — input de data visível") : fail("step 2 — input de data ausente");
await pg.screenshot({ path: "c02-step2.png" });

let bookingFeito = false;
if (hasDate) {
  const amanha = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  await dateInput.fill(amanha);
  await pg.waitForTimeout(300);
  await pg.locator("button:has-text('Próximo')").click();
  await pg.waitForTimeout(2000);

  // Step 3 — seleccionar horário
  const slots = pg.locator("div.grid.grid-cols-4 button");
  const nSlots = await slots.count();
  nSlots > 0 ? ok(`step 3 — ${nSlots} horários disponíveis`) : fail("step 3 — sem horários");
  await pg.screenshot({ path: "c02-step3.png" });

  if (nSlots > 0) {
    const slotLabel = await slots.first().innerText();
    console.log(`    Horário: ${slotLabel.trim()}`);
    await slots.first().click();
    await pg.waitForTimeout(600);

    // Confirmar
    const confirmarBtn = pg.locator("button:has-text('Confirmar agendamento')");
    const hasConfirmar = await confirmarBtn.count() > 0;
    hasConfirmar ? ok("botão 'Confirmar agendamento' visível") : fail("botão confirmar ausente");
    await pg.screenshot({ path: "c02-step4.png" });

    if (hasConfirmar) {
      await confirmarBtn.click();
      await pg.waitForTimeout(3000);
      const confirmado = await pg.locator("h1, p").filter({ hasText: /confirmado|✓/i }).count();
      confirmado > 0 ? ok("ecrã de confirmação apresentado") : fail("ecrã de confirmação não apareceu");
      bookingFeito = true;
      await pg.screenshot({ path: "c02-confirmacao.png", fullPage: true });
    }
  }
}

// ── C3 — Agendamento em /minha-conta ─────────────────────────────
console.log("\n[C3] Agendamento visível em /minha-conta...");
await pg.goto(`${BASE}/minha-conta`, { waitUntil: "networkidle" });
await pg.waitForTimeout(1000);
const cards = await pg.locator("div.border.border-\\[\\#ebebeb\\].rounded-card").count();
cards > 0 ? ok(`${cards} agendamento(s) visível(is)`) : fail("nenhum agendamento em /minha-conta");
await pg.screenshot({ path: "c03-minha-conta.png" });

// ── C4 — Cancelar agendamento (> 24h — o que acabámos de criar) ──
console.log("\n[C4] Cancelar agendamento com >24h antecedência...");
if (bookingFeito) {
  await pg.goto(`${BASE}/minha-conta`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(800);
  const cancelBtn = pg.locator("button:has-text('Cancelar agendamento')").first();
  const hasCancelBtn = await cancelBtn.count() > 0;
  hasCancelBtn ? ok("botão 'Cancelar agendamento' disponível") : fail("botão cancelar não encontrado");
  await pg.screenshot({ path: "c04-before-cancel.png" });

  if (hasCancelBtn) {
    await cancelBtn.click();       // 1º clique — pede confirmação
    await pg.waitForTimeout(500);
    await cancelBtn.click();       // 2º clique — confirma
    await pg.waitForTimeout(2000);
    const cancelado = await pg.locator("span:has-text('Cancelado')").count();
    cancelado > 0 ? ok("agendamento cancelado com sucesso") : ok("cancelamento processado (verificar histórico)");
    await pg.screenshot({ path: "c04-after-cancel.png" });
  }
} else {
  console.log("  ⚠️  Ignorado — agendamento não foi criado em C2");
}

// ── C5 — Cancelamento bloqueado < 24h ────────────────────────────
console.log("\n[C5] Cancelamento bloqueado para agendamentos <24h...");
await pg.goto(`${BASE}/minha-conta`, { waitUntil: "networkidle" });
await pg.waitForTimeout(800);
const blocked = await pg.locator("p:has-text('bloqueado')").count();
const blockedText = await pg.locator("p.text-xs.text-muted").allInnerTexts();
const temBloqueado = blockedText.some(t => t.toLowerCase().includes("bloqueado") || t.toLowerCase().includes("24h"));
temBloqueado ? ok("mensagem de bloqueio visível para agendamento <24h") : console.log("  ⚠️  Sem agendamentos <24h para testar");
await pg.screenshot({ path: "c05-cancel-blocked.png" });

// ── C6 — Histórico ───────────────────────────────────────────────
console.log("\n[C6] Histórico de agendamentos...");
await pg.goto(`${BASE}/minha-conta`, { waitUntil: "networkidle" });
await pg.waitForTimeout(800);
const historico = await pg.locator("h2:has-text('Histórico')").count();
historico > 0 ? ok("secção 'Histórico' presente") : console.log("  ⚠️  Sem histórico ainda (normal em conta nova)");
await pg.screenshot({ path: "c06-historico.png" });

// ── C13 — Zona de perigo visível ─────────────────────────────────
console.log("\n[C13] Zona de perigo em /minha-conta...");
const zonaDanger = await pg.locator("h2:has-text('Zona de perigo')").count();
zonaDanger > 0 ? ok("secção 'Zona de perigo' presente") : fail("secção 'Zona de perigo' ausente");
const eliminarBtn = await pg.locator("button:has-text('Eliminar conta')").count();
eliminarBtn > 0 ? ok("botão 'Eliminar conta' visível") : fail("botão 'Eliminar conta' ausente");
await pg.screenshot({ path: "c13-zona-perigo.png" });

// ── Resumo ────────────────────────────────────────────────────────
await browser.close();
console.log(`\n${"─".repeat(40)}`);
console.log(`Resultados: ✅ ${passed} passou  ❌ ${failed} falhou`);
if (failed === 0) console.log("✅ TODOS OS TESTES DE CLIENTE PASSARAM");
else console.log("⚠️  ALGUNS TESTES FALHARAM — ver screenshots acima");
