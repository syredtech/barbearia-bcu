/**
 * Authorization tests for BCU API routes.
 * Logs in as each role, captures session cookies, then fires requests
 * against all protected endpoints and reports pass/fail.
 */
import { chromium } from "playwright";

const BASE = "https://barbearia-bcu.vercel.app";

// ── colours ────────────────────────────────────────────────────────────────
const G = "\x1b[32m✔\x1b[0m";
const R = "\x1b[31m✘\x1b[0m";
const Y = "\x1b[33m⚠\x1b[0m";
let pass = 0, fail = 0, warn = 0;

function result(ok, label, got, expected) {
  if (ok === "pass")  { pass++; console.log(`  ${G} ${label} → ${got}`); }
  if (ok === "fail")  { fail++; console.log(`  ${R} ${label} → got ${got}, expected ${expected}`); }
  if (ok === "warn")  { warn++; console.log(`  ${Y} ${label} → ${got} (atenção)`); }
}

// ── auth helper ────────────────────────────────────────────────────────────
async function getCookie(email, password) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");
  await page.fill("form input[type=email]", email);
  await page.fill("form input[type=password]", password);
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(14000); // Vercel cold start
  const cookies = await ctx.cookies();
  await browser.close();
  const sessionCookie = cookies.find(
    (c) => c.name === "__Secure-next-auth.session-token" || c.name === "next-auth.session-token"
  );
  return sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : null;
}

// ── request helper ─────────────────────────────────────────────────────────
async function req(method, path, cookie, body) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status;
}

// ── expect helpers ─────────────────────────────────────────────────────────
function expectBlocked(label, status) {
  // 401 or 403 are both acceptable "blocked" responses
  if (status === 401 || status === 403) result("pass", label, status);
  else result("fail", label, status, "401 or 403");
}
function expectAllowed(label, status) {
  if (status >= 200 && status < 300) result("pass", label, status);
  else result("fail", label, status, "2xx");
}

// ══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log("\n\x1b[1mBCU — Authorization Tests\x1b[0m");
  console.log("Logging in as each role (aguarda cold starts)…\n");

  // ── 1. Get session cookies for each role ──────────────────────────────
  const [cookieClient, cookieOwnerA, cookieOwnerB, cookieAdmin] = await Promise.all([
    getCookie("cliente@email.cv",  "senha123"),
    getCookie("joao@barbearia.cv", "senha123"),  // Owner A
    getCookie("maria@salao.cv",    "senha123"),  // Owner B
    getCookie("admin@bcu.cv",      "admin123"),
  ]);

  console.log("Cookies obtidos:");
  console.log("  client :", cookieClient  ? "✔" : "✘ FALHOU LOGIN");
  console.log("  ownerA :", cookieOwnerA  ? "✔" : "✘ FALHOU LOGIN");
  console.log("  ownerB :", cookieOwnerB  ? "✔" : "✘ FALHOU LOGIN");
  console.log("  admin  :", cookieAdmin   ? "✔" : "✘ FALHOU LOGIN");

  // ── 2. Get real IDs (as admin) to use in tests ────────────────────────
  console.log("\nA obter IDs reais…");
  const venuesRes  = await fetch(`${BASE}/api/admin/venues?status=approved`, { headers: { Cookie: cookieAdmin } });
  const venues     = await venuesRes.json();
  const joaoVenue  = venues.find(v => v.owner?.email?.includes("joao"));
  const mariaVenue = venues.find(v => v.owner?.email?.includes("maria"));
  console.log("  Venue João :", joaoVenue?.id ?? "não encontrado");
  console.log("  Venue Maria:", mariaVenue?.id ?? "não encontrado");

  // Get a service belonging to João
  const servicosRes = await fetch(`${BASE}/api/owner/servicos`, { headers: { Cookie: cookieOwnerA } });
  const servicos    = await servicosRes.json();
  const joaoServico = Array.isArray(servicos) ? servicos[0] : null;
  console.log("  Serviço João:", joaoServico?.id ?? "não encontrado");

  // Get an agendamento for João's venue
  const agendRes  = await fetch(`${BASE}/api/admin/agendamentos`, { headers: { Cookie: cookieAdmin } });
  const agendList = await agendRes.json();
  const joaoAgend = Array.isArray(agendList)
    ? agendList.find(a => a.venue?.name?.toLowerCase().includes("jo"))
    : null;
  console.log("  Agendamento (João's venue):", joaoAgend?.id ?? "não encontrado");

  // ═══════════════════════════════════════════════════════════════════════
  // BLOCO 1 — Rotas /api/admin/* só para admin
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n\x1b[1m[1] Rotas /api/admin — devem bloquear todos excepto admin\x1b[0m");

  const adminRoutes = [
    ["GET",   "/api/admin/stats"],
    ["GET",   "/api/admin/venues?status=pending"],
    ["GET",   "/api/admin/users?role=owner"],
    ["GET",   "/api/admin/agendamentos"],
  ];

  for (const [m, path] of adminRoutes) {
    const anon   = await req(m, path, null);
    const client = await req(m, path, cookieClient);
    const owner  = await req(m, path, cookieOwnerA);
    const admin  = await req(m, path, cookieAdmin);
    expectBlocked(`anon   ${m} ${path}`, anon);
    expectBlocked(`client ${m} ${path}`, client);
    expectBlocked(`owner  ${m} ${path}`, owner);
    expectAllowed(`admin  ${m} ${path}`, admin);
  }

  // PATCH /api/admin/venues/:id
  if (joaoVenue) {
    const anonP   = await req("PATCH", `/api/admin/venues/${joaoVenue.id}`, null,         { status: "pending" });
    const clientP = await req("PATCH", `/api/admin/venues/${joaoVenue.id}`, cookieClient, { status: "pending" });
    const ownerP  = await req("PATCH", `/api/admin/venues/${joaoVenue.id}`, cookieOwnerA, { status: "pending" });
    const adminP  = await req("PATCH", `/api/admin/venues/${joaoVenue.id}`, cookieAdmin,  { status: "approved" });
    expectBlocked(`anon   PATCH /api/admin/venues/:id`, anonP);
    expectBlocked(`client PATCH /api/admin/venues/:id`, clientP);
    expectBlocked(`owner  PATCH /api/admin/venues/:id`, ownerP);
    expectAllowed(`admin  PATCH /api/admin/venues/:id`, adminP);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BLOCO 2 — Rotas /api/owner/* só para owners
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n\x1b[1m[2] Rotas /api/owner — devem bloquear anónimo, cliente e admin\x1b[0m");

  const ownerRoutes = [
    ["GET",  "/api/owner/venue"],
    ["GET",  "/api/owner/servicos"],
    // horario uses PUT — tested separately below
    // ["PUT",  "/api/owner/horario"],
    ["GET",  "/api/owner/funcionarios"],
    ["GET",  "/api/owner/notificacoes"],
    ["GET",  "/api/owner/horario-atual"],
  ];

  for (const [m, path] of ownerRoutes) {
    const anon   = await req(m, path, null);
    const client = await req(m, path, cookieClient);
    const admin  = await req(m, path, cookieAdmin);
    const owner  = await req(m, path, cookieOwnerA);
    expectBlocked(`anon   ${m} ${path}`, anon);
    expectBlocked(`client ${m} ${path}`, client);
    expectBlocked(`admin  ${m} ${path}`, admin);
    expectAllowed(`owner  ${m} ${path}`, owner);
  }

  // PUT /api/owner/horario — tested with valid body
  {
    const horarioBody = { scheduleStart: "08:00", scheduleEnd: "18:00", slotDuration: 30, closedDays: [] };
    const anonH   = await req("PUT", "/api/owner/horario", null,         horarioBody);
    const clientH = await req("PUT", "/api/owner/horario", cookieClient, horarioBody);
    const adminH  = await req("PUT", "/api/owner/horario", cookieAdmin,  horarioBody);
    const ownerH  = await req("PUT", "/api/owner/horario", cookieOwnerA, horarioBody);
    expectBlocked(`anon   PUT /api/owner/horario`, anonH);
    expectBlocked(`client PUT /api/owner/horario`, clientH);
    expectBlocked(`admin  PUT /api/owner/horario`, adminH);
    expectAllowed(`owner  PUT /api/owner/horario`, ownerH);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BLOCO 3 — Cross-owner isolation (Owner B tentando aceder recursos de A)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n\x1b[1m[3] Cross-owner isolation — Owner B não pode aceder recursos de Owner A\x1b[0m");

  if (joaoServico) {
    const mariaEditJoaoServico = await req(
      "PUT", `/api/owner/servicos/${joaoServico.id}`, cookieOwnerB,
      { name: "HACK", description: "", duration: 30, price: 0 }
    );
    const mariaDelJoaoServico = await req(
      "DELETE", `/api/owner/servicos/${joaoServico.id}`, cookieOwnerB
    );
    // expect 404 (not found for this owner) or 401/403
    const editOk = [401, 403, 404].includes(mariaEditJoaoServico);
    const delOk  = [401, 403, 404].includes(mariaDelJoaoServico);
    result(editOk ? "pass" : "fail",
      "ownerB PUT  /api/owner/servicos/[joaoId]",
      mariaEditJoaoServico, "401/403/404");
    result(delOk ? "pass" : "fail",
      "ownerB DELETE /api/owner/servicos/[joaoId]",
      mariaDelJoaoServico, "401/403/404");
  } else {
    result("warn", "cross-owner servico test skipped", "sem serviço disponível");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BLOCO 4 — /api/agendamentos/:id PATCH — isolamento por role
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n\x1b[1m[4] /api/agendamentos/:id — isolamento por role\x1b[0m");

  if (joaoAgend) {
    // Anon cannot modify
    const anonPatch = await req("PATCH", `/api/agendamentos/${joaoAgend.id}`, null, { status: "cancelled" });
    expectBlocked(`anon PATCH /api/agendamentos/:id`, anonPatch);

    // Owner B (Maria) cannot manage João's agendamento
    const mariaPatch = await req("PATCH", `/api/agendamentos/${joaoAgend.id}`, cookieOwnerB, { status: "completed" });
    const mariaOk = [401, 403, 404].includes(mariaPatch);
    result(mariaOk ? "pass" : "fail",
      "ownerB PATCH /api/agendamentos/[joaoAgendId]",
      mariaPatch, "401/403/404");

    // Owner A (João) can manage his own appointment
    const joaoPatch = await req("PATCH", `/api/agendamentos/${joaoAgend.id}`, cookieOwnerA, { status: "completed" });
    const joaoOk = joaoPatch === 200;
    result(joaoOk ? "pass" : "fail",
      "ownerA PATCH /api/agendamentos/[próprio]",
      joaoPatch, "200");
  } else {
    result("warn", "agendamentos cross-test skipped", "sem agendamento disponível");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BLOCO 5 — Stripe checkout só com sessão
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n\x1b[1m[5] /api/stripe/checkout — requer sessão\x1b[0m");
  const stripeAnon  = await req("POST", "/api/stripe/checkout", null,         { venueId: "x" });
  const stripeOwner = await req("POST", "/api/stripe/checkout", cookieOwnerA, { venueId: joaoVenue?.id ?? "x" });
  expectBlocked(`anon  POST /api/stripe/checkout`, stripeAnon);
  // Owner with valid venueId should get 200 or redirect (Stripe URL); 400 = venueId inválido, still authed
  const stripeOwnerOk = stripeOwner !== 401 && stripeOwner !== 403;
  result(stripeOwnerOk ? "pass" : "fail",
    `owner POST /api/stripe/checkout`,
    stripeOwner, "não 401/403");

  // ═══════════════════════════════════════════════════════════════════════
  // SUMÁRIO
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n${"─".repeat(52)}`);
  console.log(`\x1b[1mResultado: ${G} ${pass} pass  ${R} ${fail} fail  ${Y} ${warn} warn\x1b[0m`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
