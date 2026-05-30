"use client";
import { useEffect, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────
interface Stats {
  venues: { total: number; pending: number; approved: number; rejected: number };
  users: { total: number; owners: number; clients: number };
  agendamentos: { total: number; hoje: number };
}

interface Venue {
  id: string; name: string; category: string; status: string;
  subscriptionStatus: string | null; createdAt: string;
  owner: { name: string; email: string };
}

interface AppUser {
  id: string; name: string; email: string; role: string; createdAt: string;
  venue: { name: string; status: string; subscriptionStatus: string | null } | null;
  _count: { agendamentos: number };
}

interface Agendamento {
  id: string; date: string; horario: string; status: string;
  client: { name: string; email: string } | null;
  guestName: string | null;
  guestPhone: string | null;
  venue: { name: string; category: string };
  servico: { name: string; price: number };
}

// ── Constants ──────────────────────────────────────────────────
type TopTab = "overview" | "venues" | "users" | "agendamentos";
type VenueFilter = "pending" | "approved" | "rejected";

const TOP_TABS: { id: TopTab; label: string }[] = [
  { id: "overview",     label: "Visão Geral" },
  { id: "venues",       label: "Estabelecimentos" },
  { id: "users",        label: "Utilizadores" },
  { id: "agendamentos", label: "Agendamentos" },
];

const VENUE_FILTERS: { id: VenueFilter; label: string }[] = [
  { id: "pending",  label: "Pendentes" },
  { id: "approved", label: "Aprovados" },
  { id: "rejected", label: "Rejeitados" },
];

// ── Helpers ────────────────────────────────────────────────────
function fmt(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("pt-CV", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTs(ts: string) {
  return new Date(ts).toLocaleDateString("pt-CV", { day: "numeric", month: "short", year: "numeric" });
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "text-green-700 bg-green-50",
    active:   "text-green-700 bg-green-50",
    pending:  "text-yellow-700 bg-yellow-50",
    rejected: "text-red-600 bg-red-50",
    past_due: "text-red-600 bg-red-50",
  };
  const labels: Record<string, string> = {
    approved: "Aprovado", active: "Ativa", pending: "Pendente",
    rejected: "Rejeitado", past_due: "Em atraso",
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-pill font-medium ${map[status] ?? "text-muted bg-[#f5f5f5]"}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="border border-[#ebebeb] rounded-card p-6">
      <p className="text-xs text-muted uppercase tracking-widest mb-3">{label}</p>
      <p className="font-serif text-4xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-muted mt-2">{sub}</p>}
    </div>
  );
}

// ── Table helpers ──────────────────────────────────────────────
function TH({ children }: { children: string }) {
  return (
    <th className="text-left px-5 py-4 text-xs text-muted uppercase tracking-widest font-medium">
      {children}
    </th>
  );
}
function TD({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}
function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="border border-[#ebebeb] rounded-card p-16 text-center">
      <p className="text-muted text-sm font-light">{msg}</p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab]               = useState<TopTab>("overview");
  const [stats, setStats]           = useState<Stats | null>(null);
  const [venues, setVenues]         = useState<Venue[]>([]);
  const [venueFilter, setVenueFilter] = useState<VenueFilter>("pending");
  const [users, setUsers]           = useState<AppUser[]>([]);
  const [userRole, setUserRole]     = useState<"owner" | "client">("owner");
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loadingId, setLoadingId]   = useState<string | null>(null);

  // fetch helpers
  const loadStats = useCallback(async () => {
    const r = await fetch("/api/admin/stats");
    setStats(await r.json());
  }, []);

  const loadVenues = useCallback(async () => {
    const r = await fetch(`/api/admin/venues?status=${venueFilter}`);
    setVenues(await r.json());
  }, [venueFilter]);

  const loadUsers = useCallback(async () => {
    const r = await fetch(`/api/admin/users?role=${userRole}`);
    setUsers(await r.json());
  }, [userRole]);

  const loadAgendamentos = useCallback(async () => {
    const r = await fetch("/api/admin/agendamentos");
    setAgendamentos(await r.json());
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === "venues")       loadVenues(); }, [tab, loadVenues]);
  useEffect(() => { if (tab === "users")        loadUsers(); }, [tab, loadUsers]);
  useEffect(() => { if (tab === "agendamentos") loadAgendamentos(); }, [tab, loadAgendamentos]);

  async function updateVenueStatus(id: string, status: string) {
    setLoadingId(id);
    await fetch(`/api/admin/venues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoadingId(null);
    loadVenues();
    loadStats();
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <main className="max-w-content mx-auto px-6 py-10 sm:py-16">
      {/* Header */}
      <p className="text-xs text-muted uppercase tracking-widest mb-2">Admin</p>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-8 sm:mb-10">Dashboard</h1>

      {/* Top tabs */}
      <div className="flex gap-1 border-b border-[#ebebeb] mb-8 sm:mb-10 overflow-x-auto">
        {TOP_TABS.map((t) => (
          <button
            key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 px-5 py-3 text-sm transition-all duration-200 border-b-2 -mb-px
              ${tab === t.id
                ? "border-ink text-ink font-medium"
                : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
            {t.id === "venues" && (stats?.venues.pending ?? 0) > 0 && (
              <span className="ml-2 bg-ink text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                {stats?.venues.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── VISÃO GERAL ─────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-10">
          {stats ? (
            <>
              <section>
                <h2 className="font-serif text-xl font-bold text-ink mb-5">Estabelecimentos</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total" value={stats.venues.total} />
                  <StatCard label="Aprovados" value={stats.venues.approved} />
                  <StatCard label="Pendentes" value={stats.venues.pending} sub="aguardam validação" />
                  <StatCard label="Rejeitados" value={stats.venues.rejected} />
                </div>
              </section>

              <section>
                <h2 className="font-serif text-xl font-bold text-ink mb-5">Utilizadores</h2>
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Total" value={stats.users.total} />
                  <StatCard label="Proprietários" value={stats.users.owners} />
                  <StatCard label="Clientes" value={stats.users.clients} />
                </div>
              </section>

              <section>
                <h2 className="font-serif text-xl font-bold text-ink mb-5">Agendamentos</h2>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Total" value={stats.agendamentos.total} />
                  <StatCard label="Hoje" value={stats.agendamentos.hoje} />
                </div>
              </section>
            </>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="border border-[#ebebeb] rounded-card p-6 animate-pulse">
                  <div className="h-3 bg-[#f0f0f0] rounded w-1/2 mb-4" />
                  <div className="h-8 bg-[#f0f0f0] rounded w-1/3" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ESTABELECIMENTOS ────────────────────────────────── */}
      {tab === "venues" && (
        <div>
          {/* Sub-filter */}
          <div className="flex gap-1 border-b border-[#ebebeb] mb-8">
            {VENUE_FILTERS.map((f) => (
              <button
                key={f.id} onClick={() => setVenueFilter(f.id)}
                className={`px-5 py-3 text-sm transition-all duration-200 border-b-2 -mb-px
                  ${venueFilter === f.id
                    ? "border-ink text-ink font-medium"
                    : "border-transparent text-muted hover:text-ink"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {venues.length === 0 ? (
            <EmptyState msg="Nenhum estabelecimento nesta categoria." />
          ) : (
            <div className="overflow-x-auto rounded-card border border-[#ebebeb]">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="border-b border-[#ebebeb]">
                  <tr>
                    {["Estabelecimento", "Proprietário", "Categoria", "Assinatura", "Data", ""].map(h => (
                      <TH key={h}>{h}</TH>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {venues.map((v, i) => (
                    <tr key={v.id}
                      className={`${i < venues.length - 1 ? "border-b border-[#ebebeb]" : ""} hover:bg-[#fafafa] transition-colors`}>
                      <TD>
                        <p className="font-serif font-bold text-ink">{v.name}</p>
                        <p className="text-xs text-muted font-light capitalize mt-0.5">{v.category}</p>
                      </TD>
                      <TD>
                        <p className="text-ink font-light">{v.owner.name}</p>
                        <p className="text-xs text-muted font-light">{v.owner.email}</p>
                      </TD>
                      <TD className="text-muted font-light capitalize">{v.category}</TD>
                      <TD>
                        {v.subscriptionStatus
                          ? <StatusPill status={v.subscriptionStatus} />
                          : <span className="text-xs text-muted">—</span>}
                      </TD>
                      <TD className="text-muted font-light text-xs">{fmtTs(v.createdAt)}</TD>
                      <TD>
                        {venueFilter === "pending" && (
                          <div className="flex gap-2">
                            <button onClick={() => updateVenueStatus(v.id, "approved")} disabled={loadingId === v.id}
                              className="bg-ink text-white px-4 py-1.5 rounded-pill text-xs font-medium hover:bg-[#333] transition-all duration-200 disabled:opacity-40">
                              Aprovar
                            </button>
                            <button onClick={() => updateVenueStatus(v.id, "rejected")} disabled={loadingId === v.id}
                              className="border border-[#ebebeb] text-muted px-4 py-1.5 rounded-pill text-xs hover:border-red-400 hover:text-red-600 transition-all duration-200 disabled:opacity-40">
                              Rejeitar
                            </button>
                          </div>
                        )}
                        {venueFilter !== "pending" && (
                          <button onClick={() => updateVenueStatus(v.id, "pending")}
                            className="text-xs text-muted underline underline-offset-2 hover:text-ink transition-colors">
                            Repor
                          </button>
                        )}
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── UTILIZADORES ────────────────────────────────────── */}
      {tab === "users" && (
        <div>
          {/* Role toggle */}
          <div className="flex gap-3 mb-8">
            {(["owner", "client"] as const).map((r) => (
              <button key={r} onClick={() => setUserRole(r)}
                className={`px-5 py-2 rounded-pill text-sm transition-all duration-200
                  ${userRole === r ? "bg-ink text-white" : "border border-[#ebebeb] text-muted hover:border-ink hover:text-ink"}`}>
                {r === "owner" ? "Proprietários" : "Clientes"}
              </button>
            ))}
          </div>

          {users.length === 0 ? (
            <EmptyState msg="Nenhum utilizador encontrado." />
          ) : (
            <div className="overflow-x-auto rounded-card border border-[#ebebeb]">
              <table className="w-full min-w-[580px] text-sm">
                <thead className="border-b border-[#ebebeb]">
                  <tr>
                    {userRole === "owner"
                      ? ["Nome", "Email", "Estabelecimento", "Status", "Assinatura", "Registo"].map(h => <TH key={h}>{h}</TH>)
                      : ["Nome", "Email", "Agendamentos", "Registo"].map(h => <TH key={h}>{h}</TH>)
                    }
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id}
                      className={`${i < users.length - 1 ? "border-b border-[#ebebeb]" : ""} hover:bg-[#fafafa] transition-colors`}>
                      <TD><p className="font-medium text-ink">{u.name}</p></TD>
                      <TD><p className="text-muted font-light">{u.email}</p></TD>
                      {userRole === "owner" ? (
                        <>
                          <TD>
                            {u.venue
                              ? <p className="text-ink font-light">{u.venue.name}</p>
                              : <span className="text-xs text-muted">Sem estabelecimento</span>}
                          </TD>
                          <TD>
                            {u.venue ? <StatusPill status={u.venue.status} /> : <span className="text-xs text-muted">—</span>}
                          </TD>
                          <TD>
                            {u.venue?.subscriptionStatus
                              ? <StatusPill status={u.venue.subscriptionStatus} />
                              : <span className="text-xs text-muted">—</span>}
                          </TD>
                        </>
                      ) : (
                        <TD>
                          <span className="font-serif font-bold text-ink text-lg">{u._count.agendamentos}</span>
                          <span className="text-xs text-muted ml-1">agend.</span>
                        </TD>
                      )}
                      <TD className="text-muted font-light text-xs">{fmtTs(u.createdAt)}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── AGENDAMENTOS ────────────────────────────────────── */}
      {tab === "agendamentos" && (
        <div>
          {agendamentos.length === 0 ? (
            <EmptyState msg="Nenhum agendamento encontrado." />
          ) : (
            <div className="overflow-x-auto rounded-card border border-[#ebebeb]">
              <table className="w-full min-w-[740px] text-sm">
                <thead className="border-b border-[#ebebeb]">
                  <tr>
                    {["Cliente", "Estabelecimento", "Serviço", "Valor", "Data", "Horário", "Estado"].map(h => (
                      <TH key={h}>{h}</TH>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agendamentos.map((a, i) => (
                    <tr key={a.id}
                      className={`${i < agendamentos.length - 1 ? "border-b border-[#ebebeb]" : ""} hover:bg-[#fafafa] transition-colors`}>
                      <TD>
                        <p className="font-medium text-ink">{a.client?.name ?? a.guestName ?? "Convidado"}</p>
                        <p className="text-xs text-muted font-light">{a.client?.email ?? (a.guestPhone ? `${a.guestPhone.slice(0, 4)}***` : "")}</p>
                      </TD>
                      <TD>
                        <p className="text-ink font-light">{a.venue.name}</p>
                        <p className="text-xs text-muted capitalize">{a.venue.category}</p>
                      </TD>
                      <TD className="text-muted font-light">{a.servico.name}</TD>
                      <TD className="text-ink font-medium">
                        {a.servico.price.toLocaleString("pt-CV")} ECV
                      </TD>
                      <TD className="text-muted font-light text-xs">{fmt(a.date)}</TD>
                      <TD className="text-muted font-light">{a.horario}</TD>
                      <TD><StatusPill status={a.status} /></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
