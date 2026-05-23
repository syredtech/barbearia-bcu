import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EstabelecimentoPage({
  params,
}: {
  params: { slug: string };
}) {
  const venue = await prisma.venue.findUnique({
    where: { slug: params.slug },
    include: { servicos: true },
  });

  const subscriptionOk =
    venue?.subscriptionStatus === "active" &&
    venue.subscriptionExpiresAt != null &&
    new Date(venue.subscriptionExpiresAt) > new Date();

  if (!venue || venue.status !== "approved" || !subscriptionOk) notFound();

  return (
    <main className="max-w-content mx-auto px-6 py-16">
      {/* Breadcrumb */}
      <p className="text-xs text-muted mb-8">
        <Link href="/estabelecimentos" className="hover:text-ink transition-colors">
          Estabelecimentos
        </Link>
        {" / "}
        <span className="text-ink">{venue.name}</span>
      </p>

      {/* Header */}
      <div className="max-w-[640px] mb-14">
        <span className="text-xs font-medium uppercase tracking-widest text-muted">
          {venue.category}
        </span>
        <h1 className="font-serif text-5xl font-bold text-ink mt-2 mb-4 leading-tight">
          {venue.name}
        </h1>
        {venue.description && (
          <p className="text-muted font-light leading-relaxed text-[15px]">
            {venue.description}
          </p>
        )}
        <div className="flex flex-col gap-1 mt-5 text-sm text-muted font-light">
          {venue.address && <span>{venue.address}</span>}
          {venue.phone   && <span>{venue.phone}</span>}
        </div>
      </div>

      {/* Divider */}
      <div className="divider mb-12" />

      {/* Services */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-6">Serviços</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {venue.servicos.map((servico) => (
          <div
            key={servico.id}
            className="border border-[#ebebeb] rounded-card p-6 flex items-center justify-between
                       hover:border-[#ccc] transition-colors duration-200"
          >
            <div>
              <h3 className="font-serif font-bold text-ink text-[15px]">{servico.name}</h3>
              {servico.description && (
                <p className="text-muted text-sm font-light mt-1">{servico.description}</p>
              )}
              <p className="text-muted text-xs mt-2">{servico.duration} min</p>
            </div>
            <div className="text-right ml-6 shrink-0">
              <p className="text-ink font-medium text-sm">
                {servico.price.toLocaleString("pt-CV")} ECV
              </p>
              <Link
                href={`/agendar/${venue.slug}?servicoId=${servico.id}`}
                className="mt-3 inline-block bg-ink text-white px-5 py-2 rounded-pill text-xs
                           font-medium hover:bg-[#333] transition-all duration-200"
              >
                Agendar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
