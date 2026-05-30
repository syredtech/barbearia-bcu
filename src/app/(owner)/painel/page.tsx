import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import AssinaturaCard from "@/components/AssinaturaCard";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") redirect("/login");

  const venue = await prisma.venue.findUnique({
    where: { ownerId: session.user.id },
    include: {
      servicos: true,
      agendamentos: {
        include: { client: true, servico: true },
        orderBy: [{ date: "desc" }, { horario: "asc" }],
        take: 10,
      },
    },
  });

  if (!venue) {
    return (
      <main className="max-w-content mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl font-bold text-ink mb-4">Painel</h1>
        <p className="text-muted font-light mb-8">
          Ainda não tem um estabelecimento cadastrado.
        </p>
        <Link href="/parceiros" className="bg-ink text-white px-6 py-3 rounded-pill text-sm font-medium hover:bg-[#333] transition-all duration-200">
          Cadastrar estabelecimento
        </Link>
      </main>
    );
  }

  const hoje = new Date().toISOString().split("T")[0];
  const agendamentosHoje = venue.agendamentos.filter((a) => a.date === hoje);
  const totalAgendamentos = await prisma.agendamento.count({ where: { venueId: venue.id } });

  const statusColor = venue.status === "approved" ? "text-green-700 bg-green-50" : venue.status === "pending" ? "text-yellow-700 bg-yellow-50" : "text-red-600 bg-red-50";
  const statusLabel = venue.status === "approved" ? "Aprovado" : venue.status === "pending" ? "Aguardando aprovação" : "Rejeitado";

  return (
    <main className="max-w-content mx-auto px-6 py-10 sm:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 sm:mb-12">
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-2">Painel</p>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-ink">{venue.name}</h1>
          <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-pill font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap mt-5 sm:mt-0">
          {[
            { href: "/painel/perfil",       label: "Perfil",       icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 8a8 8 0 1 1 16 0" },
            { href: "/painel/horario",      label: "Horário",      icon: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l3 2" },
            { href: "/painel/servicos",     label: "Serviços",     icon: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" },
            { href: "/painel/qrcode",       label: "QR Code",      icon: "M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z" },
            { href: "/painel/funcionarios", label: "Funcionários", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="inline-flex items-center gap-1.5 border border-[#ebebeb] text-muted px-4 py-2 rounded-pill text-sm hover:border-ink hover:text-ink transition-all duration-200">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={icon} />
              </svg>
              {label}
            </Link>
          ))}
          <Link href="/painel/agenda"
            className="inline-flex items-center gap-1.5 bg-ink text-white px-4 py-2 rounded-pill text-sm font-medium hover:bg-[#333] transition-all duration-200">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Agenda
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Hoje",     value: agendamentosHoje.length, sub: "marcações hoje" },
          { label: "Total",    value: totalAgendamentos,        sub: "desde sempre" },
          { label: "Serviços", value: venue.servicos.length,    sub: "configurados" },
        ].map((m) => (
          <div key={m.label} className="border border-[#ebebeb] rounded-card p-6">
            <p className="text-xs text-muted uppercase tracking-widest mb-3">{m.label}</p>
            <p className="font-serif text-4xl font-bold text-ink">{m.value}</p>
            <p className="text-xs text-muted font-light mt-2">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Subscription */}
      <div className="mb-10">
        <AssinaturaCard status={venue.subscriptionStatus} expiresAt={venue.subscriptionExpiresAt} />
      </div>

      {/* Recent appointments */}
      <div>
        <h2 className="font-serif text-xl font-bold text-ink mb-5">Últimos agendamentos</h2>
        {venue.agendamentos.length === 0 ? (
          <div className="border border-[#ebebeb] rounded-card p-10 text-center">
            <p className="text-muted text-sm font-light">Nenhum agendamento ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-[#ebebeb]">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-[#ebebeb]">
                <tr>
                  {["Cliente", "Serviço", "Data", "Horário", "Estado"].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-xs text-muted uppercase tracking-widest font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {venue.agendamentos.map((a, i) => (
                  <tr key={a.id} className={`${i < venue.agendamentos.length - 1 ? "border-b border-[#ebebeb]" : ""} hover:bg-[#fafafa] transition-colors duration-100`}>
                    <td className="px-5 py-4 font-medium text-ink">{a.client?.name ?? a.guestName ?? "Convidado"}</td>
                    <td className="px-5 py-4 text-ink font-light">{a.servico.name}</td>
                    <td className="px-5 py-4 text-muted font-light">
                      {new Date(a.date + "T12:00:00").toLocaleDateString("pt-CV", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-5 py-4 text-muted font-light">{a.horario}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block text-[10px] font-medium uppercase tracking-widest px-2.5 py-0.5 rounded-pill ${
                        a.status === "confirmed"  ? "text-green-700 bg-green-50" :
                        a.status === "completed"  ? "text-muted bg-[#f5f5f5]" :
                                                    "text-red-600 bg-red-50"
                      }`}>
                        {a.status === "confirmed" ? "Confirmado" : a.status === "completed" ? "Concluído" : "Cancelado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
