import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MinhaContaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const agendamentos = await prisma.agendamento.findMany({
    where: { clientId: session.user.id },
    include: { venue: true, servico: true },
    orderBy: [{ date: "desc" }, { horario: "desc" }],
  });

  const agora = new Date();
  const proximos = agendamentos.filter((a) => new Date(`${a.date}T${a.horario}:00`) > agora);
  const anteriores = agendamentos.filter((a) => new Date(`${a.date}T${a.horario}:00`) <= agora);

  function Card({ a }: { a: (typeof agendamentos)[0] }) {
    const statusLabel = a.status === "confirmed" ? "Confirmado" : a.status === "canceled" ? "Cancelado" : a.status;
    const statusColor = a.status === "confirmed" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50";
    return (
      <div className="border border-[#ebebeb] rounded-card p-5 hover:border-[#ccc] transition-colors duration-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif font-bold text-ink text-[15px]">{a.venue.name}</p>
            <p className="text-muted text-sm font-light mt-0.5">{a.servico.name}</p>
            <p className="text-muted text-xs mt-2 font-light">
              {new Date(a.date + "T12:00:00").toLocaleDateString("pt-CV", {
                weekday: "long", day: "numeric", month: "long",
              })} · {a.horario}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${statusColor}`}>
              {statusLabel}
            </span>
            <p className="text-ink text-sm font-medium mt-3">
              {a.servico.price.toLocaleString("pt-CV")} ECV
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-[640px] mx-auto px-6 py-16">
      <p className="text-xs text-muted uppercase tracking-widest mb-2">Conta</p>
      <h1 className="font-serif text-4xl font-bold text-ink mb-1">
        Olá, {session.user.name?.split(" ")[0]}.
      </h1>
      <p className="text-muted font-light text-sm mb-12">{session.user.email}</p>

      <section className="mb-12">
        <h2 className="font-serif text-xl font-bold text-ink mb-5">
          Próximos agendamentos
          {proximos.length > 0 && (
            <span className="ml-2 text-xs font-sans font-medium text-muted">
              ({proximos.length})
            </span>
          )}
        </h2>
        {proximos.length === 0 ? (
          <div className="border border-[#ebebeb] rounded-card p-10 text-center">
            <p className="text-muted text-sm font-light">Nenhum agendamento próximo.</p>
            <a href="/estabelecimentos" className="inline-block mt-4 text-ink text-sm underline underline-offset-2">
              Explorar estabelecimentos →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {proximos.map((a) => <Card key={a.id} a={a} />)}
          </div>
        )}
      </section>

      {anteriores.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-5">
            Histórico
            <span className="ml-2 text-xs font-sans font-medium text-muted">
              ({anteriores.length})
            </span>
          </h2>
          <div className="space-y-3">
            {anteriores.map((a) => <Card key={a.id} a={a} />)}
          </div>
        </section>
      )}
    </main>
  );
}
