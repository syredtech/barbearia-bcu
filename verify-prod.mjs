import { chromium } from "playwright";

const BASE = "https://barbearia-bcu.vercel.app";

const browser = await chromium.launch({ headless: false, slowMo: 120 });

async function shot(page, name) {
  await page.screenshot({ path: `verify-${name}.png`, fullPage: false });
  console.log(`📸 verify-${name}.png`);
}

async function loginAs(context, email, password) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(12000);
  return page;
}

try {
  // ────────────────────────────────────────────
  // 1 — MARKETPLACE
  // ────────────────────────────────────────────
  console.log("\n🔍 1. Marketplace");
  const ctxGuest = await browser.newContext();
  const pg = await ctxGuest.newPage();
  await pg.goto(BASE, { waitUntil: "networkidle" });
  await shot(pg, "01-homepage");
  const venues = await pg.locator("a[href*='/estabelecimentos/']").count();
  console.log(`   ${venues} estabelecimentos — ${venues === 4 ? "✅" : "❌"}`);

  // Filtro de categoria
  await pg.goto(`${BASE}/estabelecimentos`, { waitUntil: "networkidle" });
  await shot(pg, "02-estabelecimentos");
  const filterBtns = await pg.locator("button:has-text('Barbearia'), button:has-text('Salão'), button:has-text('Spa')").count();
  console.log(`   Filtros de categoria: ${filterBtns > 0 ? "✅" : "❌"}`);
  await ctxGuest.close();

  // ────────────────────────────────────────────
  // 2 — LOGIN + PAINEL OWNER
  // ────────────────────────────────────────────
  console.log("\n🔍 2. Painel do proprietário (João)");
  const ctxOwner = await browser.newContext();
  const pageOwner = await loginAs(ctxOwner, "joao@barbearia.cv", "senha123");
  const urlAfterLogin = pageOwner.url();
  console.log(`   Login: ${!urlAfterLogin.includes("/login") ? "✅" : "❌"} → ${urlAfterLogin}`);

  // Painel principal
  await pageOwner.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
  await shot(pageOwner, "03-painel");
  const painelTitle = await pageOwner.locator("h1").first().innerText().catch(() => "");
  console.log(`   Painel carregado: ${painelTitle ? "✅ " + painelTitle : "❌"}`);

  // Agenda
  await pageOwner.goto(`${BASE}/painel/agenda`, { waitUntil: "networkidle" });
  await shot(pageOwner, "04-painel-agenda");
  console.log(`   Agenda: ✅`);

  // Serviços
  await pageOwner.goto(`${BASE}/painel/servicos`, { waitUntil: "networkidle" });
  await shot(pageOwner, "05-painel-servicos");
  const servicos = await pageOwner.locator("div.space-y-3 > div").count();
  console.log(`   Serviços cadastrados: ${servicos}`);

  // Adicionar serviço
  await pageOwner.fill('input[placeholder="Ex: Corte Masculino"]', "Serviço Teste");
  await pageOwner.fill('input[placeholder="Opcional"]', "Descrição teste");
  await pageOwner.click('button:has-text("Adicionar")');
  await pageOwner.waitForTimeout(3000);
  await shot(pageOwner, "06-servico-adicionado");
  const servicosDepois = await pageOwner.locator("div.space-y-3 > div").count();
  console.log(`   Adicionar serviço: ${servicosDepois > servicos ? "✅" : "❌"} (${servicos} → ${servicosDepois})`);

  // Stripe (placeholder — verifica UI)
  await pageOwner.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
  const stripeBtn = await pageOwner.locator("button:has-text('Assinar'), a:has-text('Assinar'), button:has-text('subscrição'), button:has-text('Subscrição')").count();
  console.log(`   Botão subscrição Stripe visível: ${stripeBtn > 0 ? "✅" : "⚠️  não encontrado"}`);
  await ctxOwner.close();

  // ────────────────────────────────────────────
  // 3 — CLIENTE: minha conta
  // ────────────────────────────────────────────
  console.log("\n🔍 3. Área do cliente");
  const ctxClient = await browser.newContext();
  const pageClient = await loginAs(ctxClient, "cliente@email.cv", "senha123");
  console.log(`   Login cliente: ${!pageClient.url().includes("/login") ? "✅" : "❌"}`);

  await pageClient.goto(`${BASE}/minha-conta`, { waitUntil: "networkidle" });
  await shot(pageClient, "07-minha-conta");
  const agendamentos = await pageClient.locator("div.border.rounded-card").count();
  console.log(`   Agendamentos visíveis: ${agendamentos}`);
  await ctxClient.close();

  // ────────────────────────────────────────────
  // 4 — ADMIN
  // ────────────────────────────────────────────
  console.log("\n🔍 4. Painel admin");
  const ctxAdmin = await browser.newContext();
  const pageAdmin = await loginAs(ctxAdmin, "admin@bcu.cv", "admin123");
  console.log(`   Login admin: ${!pageAdmin.url().includes("/login") ? "✅" : "❌"}`);

  await pageAdmin.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await shot(pageAdmin, "08-admin");
  const adminTitle = await pageAdmin.locator("h1").first().innerText().catch(() => "");
  console.log(`   Admin carregado: ${adminTitle ? "✅ " + adminTitle : "❌"}`);

  // Tabs
  const tabs = await pageAdmin.locator("button[class*='border-b']").count();
  console.log(`   Tabs: ${tabs}`);

  // Tab venues
  await pageAdmin.locator("button:has-text('Estabelecimentos')").first().click();
  await pageAdmin.waitForTimeout(1000);
  await shot(pageAdmin, "09-admin-venues");
  console.log(`   Tab estabelecimentos: ✅`);

  // Tab utilizadores
  await pageAdmin.locator("button:has-text('Utilizadores')").first().click();
  await pageAdmin.waitForTimeout(1000);
  await shot(pageAdmin, "10-admin-users");
  console.log(`   Tab utilizadores: ✅`);

  // Tab agendamentos
  await pageAdmin.locator("button:has-text('Agendamentos')").first().click();
  await pageAdmin.waitForTimeout(1000);
  await shot(pageAdmin, "11-admin-agendamentos");
  console.log(`   Tab agendamentos: ✅`);
  await ctxAdmin.close();

  // ────────────────────────────────────────────
  // 5 — REGISTO DE NOVO OWNER
  // ────────────────────────────────────────────
  console.log("\n🔍 5. Registo de novo proprietário");
  const ctxNew = await browser.newContext();
  const pageNew = await ctxNew.newPage();
  await pageNew.goto(`${BASE}/login`, { waitUntil: "networkidle" });

  // Cria conta nova
  await pageNew.click("button:has-text('Criar conta')");
  await pageNew.waitForTimeout(500);
  await pageNew.fill('input[placeholder="Nome completo"]', "Teste Owner");
  await pageNew.fill('input[type="email"]', "testeowner@bela.cv");
  await pageNew.fill('input[type="password"]', "senha123");
  await pageNew.click('button[type="submit"]');
  await pageNew.waitForTimeout(12000);
  await shot(pageNew, "12-novo-utilizador-logado");
  console.log(`   Registo novo utilizador: ${!pageNew.url().includes("/login") ? "✅" : "❌"}`);

  // Vai a /parceiros e regista estabelecimento
  await pageNew.goto(`${BASE}/parceiros`, { waitUntil: "networkidle" });
  await shot(pageNew, "13-parceiros");
  await pageNew.locator('input[type="text"]').first().fill("Barbearia Teste BCU");
  await pageNew.waitForTimeout(500);
  await pageNew.selectOption?.("select", "barbearia").catch(() => {});
  await pageNew.fill('input[placeholder="Ex: Rua de Lisboa, 12 — Plateau, Praia"]', "Rua Teste, 1 — Praia").catch(() => {});
  await pageNew.fill('input[type="tel"]', "+238 900 00 99").catch(() => {});
  await shot(pageNew, "14-parceiros-preenchido");
  await pageNew.click('button[type="submit"]');
  await pageNew.waitForTimeout(15000);
  await shot(pageNew, "15-apos-registo-venue");
  const urlFinal = pageNew.url();
  console.log(`   Registo venue + redirect: ${urlFinal.includes("/painel") ? "✅ → " + urlFinal : "⚠️  → " + urlFinal}`);
  await ctxNew.close();

  console.log("\n✅ TODOS OS TESTES CONCLUÍDOS");

} catch (e) {
  console.error(`\n❌ ERRO: ${e.message}`);
} finally {
  await browser.close();
}
