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
    <main className="max-w-content mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex items-start justify-between mb-12">
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-2">Painel</p>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-ink">{venue.name}</h1>
          <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-pill font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/painel/perfil" className="border border-[#ebebeb] text-muted px-5 py-2.5 rounded-pill text-sm hover:border-ink hover:text-ink transition-all duration-200">
            Perfil
          </Link>
          <Link href="/painel/horario" className="border border-[#ebebeb] text-muted px-5 py-2.5 rounded-pill text-sm hover:border-ink hover:text-ink transition-all duration-200">
            Horário
          </Link>
          <Link href="/painel/servicos" className="border border-[#ebebeb] text-muted px-5 py-2.5 rounded-pill text-sm hover:border-ink hover:text-ink transition-all duration-200">
            Serviços
          </Link>
          <Link href="/painel/qrcode" className="border border-[#ebebeb] text-muted px-5 py-2.5 rounded-pill text-sm hover:border-ink hover:text-ink transition-all duration-200">
            QR Code
          </Link>
          <Link href="/painel/funcionarios" className="border border-[#ebebeb] text-muted px-5 py-2.5 rounded-pill text-sm hover:border-ink hover:text-ink transition-all duration-200">
            Funcionários
          </Link>
          <Link href="/painel/agenda" className="bg-ink text-white px-5 py-2.5 rounded-pill text-sm font-medium hover:bg-[#333] transition-all duration-200">
            Agenda
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Hoje", value: agendamentosHoje.length },
          { label: "Total", value: totalAgendamentos },
          { label: "Serviços", value: venue.servicos.length },
        ].map((m) => (
          <div key={m.label} className="border border-[#ebebeb] rounded-card p-6">
            <p className="text-xs text-muted uppercase tracking-widest mb-3">{m.label}</p>
            <p className="font-serif text-4xl font-bold text-ink">{m.value}</p>
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
          <div className="border border-[#ebebeb] rounded-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-[#ebebeb]">
                <tr>
                  {["Cliente", "Serviço", "Data", "Horário"].map((h) => (
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
                    <td className="px-5 py-4 text-muted font-light">{a.servico.name}</td>
                    <td className="px-5 py-4 text-muted font-light">
                      {new Date(a.date + "T12:00:00").toLocaleDateString("pt-CV", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-5 py-4 text-muted font-light">{a.horario}</td>
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
