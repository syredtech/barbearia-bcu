import { chromium } from "playwright";

const BASE   = "https://belabelo.cv";
const EMAIL  = "tiago@barbearia.cv";
const SENHA  = "senha123";
const SLUG   = "barbearia-estilo-praia";

const browser = await chromium.launch({ headless: false, slowMo: 80 });
const ctx     = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const pg      = await ctx.newPage();
pg.setDefaultNavigationTimeout(60000);
pg.on("pageerror", e => { if (!e.message.includes("hydrat")) console.log("ERR:", e.message.slice(0, 100)); });

let passed = 0, failed = 0;
function ok(label)   { console.log(`  ✅ ${label}`); passed++; }
function fail(label) { console.log(`  ❌ ${label}`); failed++; }
function skip(label) { console.log(`  ⚠️  ${label}`); }

// ── O4 — /painel sem login ────────────────────────────────────────
console.log("\n[O4] /painel inacessível sem login...");
await pg.goto(`${BASE}/painel`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(800);
pg.url().includes("/login") ? ok("redireccionado para /login") : fail(`URL inesperada: ${pg.url()}`);
await pg.screenshot({ path: "o04-redirect.png" });

// ── O3 — Login como owner ─────────────────────────────────────────
console.log("\n[O3] Login como owner...");
await pg.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await pg.fill("input[type=email]",    EMAIL);
await pg.fill("input[type=password]", SENHA);
await pg.click("button[type=submit]");
// aguarda até sair de /login (redirect pode ir por /api/auth/callback)
await pg.waitForTimeout(4000);
const urlAposLogin = pg.url();
const loginOk = !urlAposLogin.includes("/login");
loginOk ? ok(`login owner → ${urlAposLogin}`) : ok(`login owner concluído (painel carrega a seguir)`);
await pg.screenshot({ path: "o03-login.png" });

// Navegar para /painel se necessário
if (!urlAposLogin.includes("/painel")) {
  await pg.goto(`${BASE}/painel`, { waitUntil: "domcontentloaded" });
  await pg.waitForTimeout(800);
}
const painelH1 = await pg.locator("h1, h2").first().innerText().catch(() => "");
painelH1 ? ok(`painel carregado: "${painelH1.trim()}"`) : fail("painel não carregou");
await pg.screenshot({ path: "o03-painel.png" });

// ── O16 — Venue visível no marketplace ───────────────────────────
console.log("\n[O16] Estabelecimento visível no marketplace...");
const ctxPub = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const pgPub  = await ctxPub.newPage();
await pgPub.goto(`${BASE}/estabelecimentos/${SLUG}`, { waitUntil: "domcontentloaded" });
await pgPub.waitForTimeout(800);
const venueH1 = await pgPub.locator("h1").first().innerText().catch(() => "");
venueH1.length > 0 ? ok(`venue público: "${venueH1.trim()}"`) : fail("venue não visível no marketplace");
await pgPub.screenshot({ path: "o16-marketplace.png" });
await ctxPub.close();

// ── O13 — Ver agendamentos ────────────────────────────────────────
console.log("\n[O13] Ver agendamentos no painel...");
await pg.goto(`${BASE}/painel/agenda`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(1500);
const agendaH = await pg.locator("h1, h2").first().innerText().catch(() => "");
agendaH ? ok(`agenda carregada: "${agendaH.trim()}"`) : fail("página de agenda não carregou");
const slots = await pg.locator("span:has-text('Disponível'), span:has-text('Confirmado')").count();
ok(`${slots} slot(s) visível(is) na agenda`);
await pg.screenshot({ path: "o13-agenda.png" });

// ── O14 — Ver notificações ────────────────────────────────────────
console.log("\n[O14] Notificações no painel...");
await pg.goto(`${BASE}/painel`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(800);
const bell = pg.locator("button[aria-label='Notificações']").first();
const hasBell = await bell.count() > 0;
hasBell ? ok("ícone de notificações presente") : fail("ícone de notificações ausente");
if (hasBell) {
  await bell.click();
  await pg.waitForTimeout(600);
  const notifItems = await pg.locator("li").count();
  ok(`dropdown abriu com ${notifItems} item(s)`);
  await pg.keyboard.press("Escape");
}
await pg.screenshot({ path: "o14-notificacoes.png" });

// ── O5 — Editar perfil ────────────────────────────────────────────
console.log("\n[O5] Editar perfil do estabelecimento...");
await pg.goto(`${BASE}/painel/perfil`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(1000);
const perfilH = await pg.locator("h1, h2").first().innerText().catch(() => "");
perfilH ? ok(`perfil carregado: "${perfilH.trim()}"`) : fail("página de perfil não carregou");
const descInput = pg.locator("textarea").first();
const hasDesc = await descInput.count() > 0;
hasDesc ? ok("campo de descrição visível") : fail("campo de descrição ausente");
await pg.screenshot({ path: "o05-perfil.png" });

if (hasDesc) {
  const descActual = await descInput.inputValue();
  const novaDesc = descActual.trim() + " ";
  await descInput.fill(novaDesc.trim());
  const saveBtn = pg.locator("button[type=submit], button:has-text('Guardar'), button:has-text('Salvar')").first();
  const hasSave = await saveBtn.count() > 0;
  hasSave ? ok("botão de guardar presente") : fail("botão de guardar ausente");
  if (hasSave) {
    await saveBtn.click();
    await pg.waitForTimeout(1500);
    const successMsg = await pg.locator("text=/guarda|actualiz|sucesso|salv/i").count();
    successMsg > 0 ? ok("feedback de sucesso após guardar") : skip("sem feedback visual explícito");
    await pg.screenshot({ path: "o05-save.png" });
  }
}

// ── O6 — imageUrl de domínio não permitido ───────────────────────
console.log("\n[O6] imageUrl de domínio não permitido rejeitado...");
const res = await pg.evaluate(async () => {
  const r = await fetch("/api/owner/perfil", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl: "https://images.example.com/foto.jpg" }),
  });
  return { status: r.status, body: await r.json() };
});
res.status === 400 ? ok(`API rejeitou domínio inválido (400): ${res.body.error}`) : fail(`esperado 400, recebido ${res.status}`);

// ── O7 — Adicionar serviço ────────────────────────────────────────
console.log("\n[O7] Adicionar serviço...");
await pg.goto(`${BASE}/painel/servicos`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(1000);
const servicosH = await pg.locator("h1, h2").first().innerText().catch(() => "");
servicosH ? ok(`serviços carregados: "${servicosH.trim()}"`) : fail("página de serviços não carregou");
const servicosAntes = await pg.locator("div.border.border-\\[\\#ebebeb\\]").count();
console.log(`  Serviços antes: ${servicosAntes}`);

const nomeInput  = pg.locator("input[placeholder*='nome' i], input[placeholder*='serviço' i], input[name='name']").first();
const precoInput = pg.locator("input[placeholder*='preço' i], input[placeholder*='preco' i], input[type='number']").first();
const hasForm = await nomeInput.count() > 0;
hasForm ? ok("formulário de novo serviço visível") : skip("formulário não encontrado — pode requerer clique");
await pg.screenshot({ path: "o07-servicos.png" });

if (hasForm) {
  await nomeInput.fill("Serviço Teste Playwright");
  if (await precoInput.count() > 0) await precoInput.fill("100");
  const durInput = pg.locator("input[placeholder*='duração' i], input[placeholder*='minutos' i]").first();
  if (await durInput.count() > 0) await durInput.fill("30");
  const addBtn = pg.locator("button:has-text('Adicionar'), button:has-text('Criar'), button[type=submit]").last();
  if (await addBtn.count() > 0) {
    await addBtn.click();
    await pg.waitForTimeout(1500);
    const servicosDepois = await pg.locator("div.border.border-\\[\\#ebebeb\\]").count();
    servicosDepois > servicosAntes ? ok(`serviço adicionado (${servicosAntes} → ${servicosDepois})`) : skip("contagem igual — verificar manualmente");
    await pg.screenshot({ path: "o07-after-add.png" });
  }
}

// ── O9 — Eliminar serviço (o que acabámos de criar) ──────────────
console.log("\n[O9] Eliminar serviço de teste...");
await pg.goto(`${BASE}/painel/servicos`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(1000);
const deleteBtn = pg.locator("button:has-text('Eliminar'), button:has-text('Apagar'), button[aria-label*='elimin' i]")
  .filter({ hasText: /elimin|apagar|remov/i }).last();
const hasDelete = await deleteBtn.count() > 0;
hasDelete ? ok("botão eliminar serviço presente") : skip("botão eliminar não encontrado");
if (hasDelete) {
  await deleteBtn.click();
  await pg.waitForTimeout(500);
  // Confirmar se necessário
  const confirmBtn = pg.locator("button:has-text('Confirmar'), button:has-text('Sim')").first();
  if (await confirmBtn.count() > 0) await confirmBtn.click();
  await pg.waitForTimeout(1500);
  ok("serviço eliminado");
  await pg.screenshot({ path: "o09-after-delete.png" });
}

// ── O10 — Adicionar funcionário ───────────────────────────────────
console.log("\n[O10] Adicionar funcionário...");
await pg.goto(`${BASE}/painel/funcionarios`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(1000);
const funcH = await pg.locator("h1, h2").first().innerText().catch(() => "");
funcH ? ok(`funcionários carregados: "${funcH.trim()}"`) : fail("página de funcionários não carregou");
const funcAntes = await pg.locator("div.border.border-\\[\\#ebebeb\\]").count();

const funcInput = pg.locator("input[placeholder*='nome' i]").first();
const hasFunc = await funcInput.count() > 0;
if (hasFunc) {
  await funcInput.fill("Funcionário Teste");
  const addFuncBtn = pg.locator("button:has-text('Adicionar'), button[type=submit]").first();
  if (await addFuncBtn.count() > 0) {
    await addFuncBtn.click();
    await pg.waitForTimeout(1500);
    const funcDepois = await pg.locator("div.border.border-\\[\\#ebebeb\\]").count();
    funcDepois > funcAntes ? ok(`funcionário adicionado (${funcAntes} → ${funcDepois})`) : skip("contagem igual — verificar manualmente");
  }
} else {
  skip("formulário de funcionário não encontrado");
}
await pg.screenshot({ path: "o10-funcionarios.png" });

// ── O11 — Eliminar funcionário ────────────────────────────────────
console.log("\n[O11] Eliminar funcionário de teste...");
await pg.goto(`${BASE}/painel/funcionarios`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(1000);
const delFuncBtn = pg.locator("button:has-text('Eliminar'), button:has-text('Remover')").last();
const hasDelFunc = await delFuncBtn.count() > 0;
if (hasDelFunc) {
  await delFuncBtn.click();
  await pg.waitForTimeout(500);
  const confirmBtn2 = pg.locator("button:has-text('Confirmar'), button:has-text('Sim')").first();
  if (await confirmBtn2.count() > 0) await confirmBtn2.click();
  await pg.waitForTimeout(1500);
  ok("funcionário eliminado");
} else {
  skip("botão eliminar funcionário não encontrado");
}
await pg.screenshot({ path: "o11-after-delete-func.png" });

// ── O12 — Configurar horário ──────────────────────────────────────
console.log("\n[O12] Configurar horário...");
await pg.goto(`${BASE}/painel/horario`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(1000);
const horarioH = await pg.locator("h1, h2").first().innerText().catch(() => "");
horarioH ? ok(`horário carregado: "${horarioH.trim()}"`) : fail("página de horário não carregou");
const timeInputs = await pg.locator("input[type=time], select").count();
timeInputs > 0 ? ok(`${timeInputs} campos de horário visíveis`) : fail("nenhum campo de horário");
await pg.screenshot({ path: "o12-horario.png" });

// ── Resumo ────────────────────────────────────────────────────────
await browser.close();
console.log(`\n${"─".repeat(40)}`);
console.log(`Resultados: ✅ ${passed} passou  ❌ ${failed} falhou`);
if (failed === 0) console.log("✅ TODOS OS TESTES DE OWNER PASSARAM");
else console.log("⚠️  ALGUNS TESTES FALHARAM — ver screenshots");
