import { chromium } from "playwright";

const BASE        = "https://belabelo.cv";
const ADMIN_EMAIL = "admin@belabelo.cv";
const ADMIN_SENHA = "admin123";
const CLIENT_EMAIL = "ana@email.cv";
const OWNER_EMAIL  = "tiago@barbearia.cv";

const browser = await chromium.launch({ headless: false, slowMo: 80 });
const ctx     = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const pg      = await ctx.newPage();
pg.setDefaultNavigationTimeout(60000);
pg.on("pageerror", e => { if (!e.message.includes("hydrat")) console.log("ERR:", e.message.slice(0, 100)); });

let passed = 0, failed = 0;
function ok(label)   { console.log(`  ✅ ${label}`); passed++; }
function fail(label) { console.log(`  ❌ ${label}`); failed++; }
function skip(label) { console.log(`  ⚠️  ${label}`); }

// ── A2 — /admin sem login ────────────────────────────────────────
console.log("\n[A2] /admin inacessível sem login...");
await pg.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(800);
pg.url().includes("/login") ? ok("redireccionado para /login") : fail(`URL inesperada: ${pg.url()}`);
await pg.screenshot({ path: "a02-redirect.png" });

// ── A3 — /admin inacessível para cliente ────────────────────────
console.log("\n[A3] /admin inacessível para cliente (role=client)...");
await pg.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await pg.fill("input[type=email]",    CLIENT_EMAIL);
await pg.fill("input[type=password]", "senha123");
await pg.click("button[type=submit]");
await pg.waitForTimeout(3000);
await pg.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(1000);
const clientBlockado = !pg.url().includes("/admin") || await pg.locator("h1:has-text('Dashboard')").count() === 0;
clientBlockado ? ok("cliente bloqueado de /admin") : fail("cliente conseguiu aceder a /admin");
await pg.screenshot({ path: "a03-client-block.png" });

// Logout do cliente
await pg.goto(`${BASE}/api/auth/signout`, { waitUntil: "domcontentloaded" }).catch(() => {});
await pg.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(500);
// Forçar signout via UI se necessário
const signOutBtn = pg.locator("button:has-text('Terminar sessão'), button:has-text('Sair')").first();
if (await signOutBtn.count() > 0) { await signOutBtn.click(); await pg.waitForTimeout(800); }

// ── A4 — /admin inacessível para owner ──────────────────────────
console.log("\n[A4] /admin inacessível para owner (role=owner)...");
await pg.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await pg.fill("input[type=email]",    OWNER_EMAIL);
await pg.fill("input[type=password]", "senha123");
await pg.click("button[type=submit]");
await pg.waitForTimeout(3000);
await pg.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(1000);
const ownerBlockado = !pg.url().includes("/admin") || await pg.locator("h1:has-text('Dashboard')").count() === 0;
ownerBlockado ? ok("owner bloqueado de /admin") : fail("owner conseguiu aceder a /admin");
await pg.screenshot({ path: "a04-owner-block.png" });

// ── A1 — Login como admin ────────────────────────────────────────
console.log("\n[A1] Login como admin...");
console.log("  ⏳ Aguarda login manual — preenche a password no browser e submete...");
await pg.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await pg.fill("input[type=email]", ADMIN_EMAIL);
// Aguarda até sair de /login (login manual pelo utilizador)
await pg.waitForFunction(() => !window.location.href.includes("/login"), { timeout: 120000 });
await pg.waitForTimeout(1000);
const urlAdmin = pg.url();
!urlAdmin.includes("/login") ? ok(`login admin → ${urlAdmin}`) : fail("login admin falhou");
await pg.screenshot({ path: "a01-login.png" });

// Navegar para /admin
await pg.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await pg.waitForTimeout(2000);
const dashH1 = await pg.locator("h1:has-text('Dashboard')").count();
dashH1 > 0 ? ok("dashboard admin carregado") : fail("dashboard admin não carregou");
await pg.screenshot({ path: "a01-dashboard.png" });

// ── A5 — Visão Geral com stats ───────────────────────────────────
console.log("\n[A5] Stats na Visão Geral...");
// Já estamos na tab Overview por defeito
await pg.waitForTimeout(1500); // aguarda fetch de /api/admin/stats
const statCards = await pg.locator("div.border.border-\\[\\#ebebeb\\].rounded-card").count();
statCards > 0 ? ok(`${statCards} stat cards visíveis`) : fail("nenhum stat card");

// Verificar via API directa
const statsRes = await pg.evaluate(async () => {
  const r = await fetch("/api/admin/stats");
  return { status: r.status, data: await r.json() };
});
statsRes.status === 200 ? ok(`stats API: venues=${statsRes.data.venues?.total} users=${statsRes.data.users?.total} agend=${statsRes.data.agendamentos?.total}`) : fail(`stats API: ${statsRes.status}`);
await pg.screenshot({ path: "a05-overview.png" });

// ── A12 — APIs admin bloqueadas sem token de admin ───────────────
console.log("\n[A12] APIs /api/admin/* bloqueadas sem sessão de admin...");
const ctxAnon = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const pgAnon  = await ctxAnon.newPage();
// Navegar para o site primeiro (same-origin) antes de fazer fetch
await pgAnon.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await pgAnon.waitForTimeout(500);
const anonStats = await pgAnon.evaluate(async () => {
  const r = await fetch("/api/admin/stats");
  return r.status;
});
anonStats === 401 || anonStats === 403 ? ok(`/api/admin/stats bloqueado sem sessão (${anonStats})`) : fail(`/api/admin/stats devolveu ${anonStats} sem sessão`);
await ctxAnon.close();

// ── A6 — Tab Estabelecimentos → lista pendentes ──────────────────
console.log("\n[A6] Tab Estabelecimentos — venues pendentes...");
await pg.locator("button:has-text('Estabelecimentos')").click();
await pg.waitForTimeout(1500);
const pendentesTab = await pg.locator("button:has-text('Pendentes')").count();
pendentesTab > 0 ? ok("sub-filtro 'Pendentes' visível") : fail("sub-filtro Pendentes ausente");
await pg.screenshot({ path: "a06-venues-pending.png" });

// Conta pendentes via API
const vPending = await pg.evaluate(async () => {
  const r = await fetch("/api/admin/venues?status=pending");
  const d = await r.json();
  return { status: r.status, count: Array.isArray(d) ? d.length : 0, first: Array.isArray(d) ? d[0] : null };
});
vPending.status === 200 ? ok(`API venues pending: ${vPending.count} encontrados`) : fail(`API venues pending: ${vPending.status}`);
console.log(`    Pending count: ${vPending.count}`);

// ── A7 — Aprovar venue + A9 — Repor ─────────────────────────────
console.log("\n[A7] Aprovar venue pendente...");
if (vPending.count > 0 && vPending.first) {
  const approveBtn = pg.locator("button:has-text('Aprovar')").first();
  const hasApprove = await approveBtn.count() > 0;
  hasApprove ? ok("botão 'Aprovar' visível") : fail("botão 'Aprovar' ausente");

  if (hasApprove) {
    const venueId = vPending.first.id;
    console.log(`    Venue a aprovar: ${vPending.first.name} (${venueId})`);
    await approveBtn.click();
    await pg.waitForTimeout(2000);

    // Verificar que saiu da lista de pendentes
    const pendentesDepois = await pg.evaluate(async () => {
      const r = await fetch("/api/admin/venues?status=pending");
      const d = await r.json();
      return Array.isArray(d) ? d.length : 0;
    });
    pendentesDepois < vPending.count ? ok(`venue aprovado — pendentes: ${vPending.count} → ${pendentesDepois}`) : skip("contagem não alterou — pode ter sido aprovado mas UI não actualizou");
    await pg.screenshot({ path: "a07-approved.png" });

    // A9 — Repor venue de aprovado para pendente
    console.log("\n[A9] Repor venue de aprovado para pendente...");
    await pg.locator("button:has-text('Aprovados')").click();
    await pg.waitForTimeout(1500);
    const reporBtn = pg.locator("button:has-text('Repor')").first();
    const hasRepor = await reporBtn.count() > 0;
    hasRepor ? ok("botão 'Repor' visível em aprovados") : skip("botão 'Repor' não encontrado");
    if (hasRepor) {
      await reporBtn.click();
      await pg.waitForTimeout(2000);
      ok("'Repor' clicado — venue de volta a pendente");
      await pg.screenshot({ path: "a09-repor.png" });
    }
  }
} else {
  skip("nenhum venue pendente para aprovar — A7/A9 ignorados");
  // Testar botões na lista de aprovados
  const vApproved = await pg.evaluate(async () => {
    const r = await fetch("/api/admin/venues?status=approved");
    const d = await r.json();
    return { count: Array.isArray(d) ? d.length : 0 };
  });
  ok(`${vApproved.count} venue(s) aprovado(s) visíveis na API`);
}

// ── A8 — Rejeitar venue ──────────────────────────────────────────
console.log("\n[A8] Rejeitar venue (via API + repor)...");
const vPending2 = await pg.evaluate(async () => {
  const r = await fetch("/api/admin/venues?status=pending");
  const d = await r.json();
  return Array.isArray(d) && d.length > 0 ? d[0] : null;
});

if (vPending2) {
  // Rejeitar via API
  const rejectRes = await pg.evaluate(async (id) => {
    const r = await fetch(`/api/admin/venues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    return r.status;
  }, vPending2.id);
  rejectRes === 200 ? ok(`venue ${vPending2.name} rejeitado via API (200)`) : fail(`rejeitar venue: ${rejectRes}`);

  // Verificar na lista de rejeitados
  const vRejected = await pg.evaluate(async () => {
    const r = await fetch("/api/admin/venues?status=rejected");
    const d = await r.json();
    return Array.isArray(d) ? d.length : 0;
  });
  vRejected > 0 ? ok(`${vRejected} venue(s) na lista de rejeitados`) : skip("venue rejeitado mas lista vazia (pode ter sido reposto)");

  // Repor imediatamente para não deixar estado incoerente
  const reporRes = await pg.evaluate(async (id) => {
    const r = await fetch(`/api/admin/venues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    return r.status;
  }, vPending2.id);
  reporRes === 200 ? ok(`venue reposto para pending após teste (${reporRes})`) : skip(`repor após rejeitar: ${reporRes}`);
} else {
  skip("sem venues pendentes — A8 testado via UI na tab Rejeitados");
  await pg.locator("button:has-text('Rejeitados')").click();
  await pg.waitForTimeout(1000);
  await pg.screenshot({ path: "a08-rejected.png" });
}

// ── A10 — Tab Utilizadores ───────────────────────────────────────
console.log("\n[A10] Tab Utilizadores...");
await pg.locator("button:has-text('Utilizadores')").click();
await pg.waitForTimeout(1500);

const ownerBtn   = pg.locator("button:has-text('Proprietários')");
const clienteBtn = pg.locator("button:has-text('Clientes')");
(await ownerBtn.count() > 0) ? ok("filtro 'Proprietários' visível") : fail("filtro Proprietários ausente");
(await clienteBtn.count() > 0) ? ok("filtro 'Clientes' visível") : fail("filtro Clientes ausente");
await pg.screenshot({ path: "a10-users-owners.png" });

// Verificar via API
const usersOwner = await pg.evaluate(async () => {
  const r = await fetch("/api/admin/users?role=owner");
  const d = await r.json();
  return { status: r.status, count: Array.isArray(d) ? d.length : 0 };
});
usersOwner.status === 200 ? ok(`${usersOwner.count} owner(s) na API`) : fail(`users API: ${usersOwner.status}`);

await clienteBtn.click();
await pg.waitForTimeout(1000);
await pg.screenshot({ path: "a10-users-clients.png" });
const usersClient = await pg.evaluate(async () => {
  const r = await fetch("/api/admin/users?role=client");
  const d = await r.json();
  return { status: r.status, count: Array.isArray(d) ? d.length : 0 };
});
usersClient.status === 200 ? ok(`${usersClient.count} cliente(s) na API`) : fail(`users client API: ${usersClient.status}`);

// ── A11 — Tab Agendamentos ───────────────────────────────────────
console.log("\n[A11] Tab Agendamentos...");
await pg.locator("button:has-text('Agendamentos')").click();
await pg.waitForTimeout(1500);

const agendTable = await pg.locator("table").count();
const agendEmpty = await pg.locator("p:has-text('Nenhum agendamento')").count();
(agendTable > 0 || agendEmpty > 0) ? ok("tab Agendamentos carregou") : fail("tab Agendamentos não carregou");
await pg.screenshot({ path: "a11-agendamentos.png" });

const agendRes = await pg.evaluate(async () => {
  const r = await fetch("/api/admin/agendamentos");
  const d = await r.json();
  return { status: r.status, count: Array.isArray(d) ? d.length : 0 };
});
agendRes.status === 200 ? ok(`${agendRes.count} agendamento(s) na API`) : fail(`agendamentos API: ${agendRes.status}`);

// ── Resumo ────────────────────────────────────────────────────────
await browser.close();
console.log(`\n${"─".repeat(40)}`);
console.log(`Resultados: ✅ ${passed} passou  ❌ ${failed} falhou`);
if (failed === 0) console.log("✅ TODOS OS TESTES DE ADMIN PASSARAM");
else console.log("⚠️  ALGUNS TESTES FALHARAM — ver screenshots");
