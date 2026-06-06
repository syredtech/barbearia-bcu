import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import CancelButton from "@/components/CancelButton";
import AvaliarButton from "@/components/AvaliarButton";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function MinhaContaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const agendamentos = await prisma.agendamento.findMany({
    where: { clientId: session.user.id },
    select: {
      id: true,
      date: true,
      horario: true,
      status: true,
      venueId: true,
      venue: { select: { id: true, slug: true, name: true, category: true, address: true, phone: true, imageUrl: true } },
      servico: { select: { id: true, name: true, duration: true, price: true } },
      review: { select: { id: true, rating: true, comment: true } },
    },
    orderBy: [{ date: "desc" }, { horario: "desc" }],
    take: 200,
  });

  const agora = new Date();
  const proximos   = agendamentos.filter((a) => a.status !== "cancelled" && new Date(`${a.date}T${a.horario}:00`) > agora);
  const anteriores = agendamentos.filter((a) => a.status === "cancelled" || new Date(`${a.date}T${a.horario}:00`) <= agora);

  return (
    <main className="max-w-[640px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <p className="text-xs text-muted uppercase tracking-widest mb-2">Conta</p>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-1">
        Olá, {session.user.name?.split(" ")[0]}.
      </h1>
      <p className="text-muted font-light text-sm mb-10">{session.user.email}</p>

      <section className="mb-10">
        <h2 className="font-serif text-xl font-bold text-ink mb-5">
          Próximos agendamentos
          {proximos.length > 0 && (
            <span className="ml-2 text-xs font-sans font-medium text-muted">({proximos.length})</span>
          )}
        </h2>
        {proximos.length === 0 ? (
          <div className="border border-[#ebebeb] rounded-card p-10 text-center">
            <p className="text-muted text-sm font-light">Nenhum agendamento próximo.</p>
            <Link href="/" className="inline-block mt-4 text-ink text-sm underline underline-offset-2">
              Explorar estabelecimentos →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {proximos.map((a) => {
              const apptTime = new Date(`${a.date}T${a.horario}:00`);
              const hoursUntil = (apptTime.getTime() - agora.getTime()) / (1000 * 60 * 60);
              const cancelBlocked = hoursUntil < 24 ? "Cancelamento bloqueado (menos de 24h de antecedência)" : undefined;
              return (
              <div key={a.id} className="border border-[#ebebeb] rounded-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-serif font-bold text-ink text-[15px]">{a.venue.name}</p>
                    <p className="text-muted text-sm font-light mt-0.5">{a.servico.name}</p>
                    <p className="text-muted text-xs mt-2 font-light">
                      {new Date(a.date + "T12:00:00").toLocaleDateString("pt-CV", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
                      })} · {a.horario}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-pill font-medium text-green-700 bg-green-50">
                      Confirmado
                    </span>
                    <p className="text-ink text-sm font-medium mt-3">
                      {a.servico.price.toLocaleString("pt-CV")} ECV
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#f5f5f5]">
                  <CancelButton agendamentoId={a.id} blockedMessage={cancelBlocked} />
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      {anteriores.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-5">
            Histórico
            <span className="ml-2 text-xs font-sans font-medium text-muted">({anteriores.length})</span>
          </h2>
          <div className="space-y-3">
            {anteriores.map((a) => {
              const isCancelled = a.status === "cancelled";
              return (
                <div key={a.id} className="border border-[#ebebeb] rounded-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif font-bold text-ink text-[15px]">{a.venue.name}</p>
                      <p className="text-muted text-sm font-light mt-0.5">{a.servico.name}</p>
                      <p className="text-muted text-xs mt-2 font-light">
                        {new Date(a.date + "T12:00:00").toLocaleDateString("pt-CV", {
                          weekday: "long", day: "numeric", month: "long", year: "numeric",
                        })} · {a.horario}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${
                        isCancelled ? "text-red-600 bg-red-50" : "text-muted bg-[#f5f5f5]"
                      }`}>
                        {isCancelled ? "Cancelado" : a.status === "completed" ? "Concluído" : "Confirmado"}
                      </span>
                      <p className="text-ink text-sm font-medium mt-3">
                        {a.servico.price.toLocaleString("pt-CV")} ECV
                      </p>
                    </div>
                  </div>
                  {a.status === "completed" && !a.review && (
                    <div className="mt-4 pt-4 border-t border-[#f5f5f5]">
                      <AvaliarButton agendamentoId={a.id} venueId={a.venueId} />
                    </div>
                  )}
                  {a.review && (
                    <div className="mt-4 pt-4 border-t border-[#f5f5f5] flex items-center gap-1 flex-wrap">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < a.review!.rating ? "#141414" : "none"} stroke="#141414" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                      {a.review.comment && (
                        <span className="text-xs text-muted ml-2 font-light">"{a.review.comment}"</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
