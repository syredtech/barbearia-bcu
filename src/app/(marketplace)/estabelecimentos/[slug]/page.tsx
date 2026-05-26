import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShareButton from "@/components/ShareButton";

export default async function EstabelecimentoPage({
  params,
}: {
  params: { slug: string };
}) {
  const venue = await prisma.venue.findUnique({
    where: { slug: params.slug },
    include: { servicos: true },
  });

  const reviews = venue ? await prisma.review.findMany({
    where: { venueId: venue.id },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  }) : [];

  const subscriptionOk =
    venue?.subscriptionStatus === "active" &&
    venue.subscriptionExpiresAt != null &&
    new Date(venue.subscriptionExpiresAt) > new Date();

  if (!venue || venue.status !== "approved" || !subscriptionOk) notFound();

  return (
    <main className="max-w-content mx-auto px-6 py-16">
      {/* Breadcrumb */}
      <p className="text-xs text-muted mb-8">
        <Link href="/" className="hover:text-ink transition-colors">
          Início
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
        <ShareButton name={venue.name} slug={venue.slug} />
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

      {reviews.length > 0 && (
        <>
          <div className="divider my-12" />
          <h2 className="font-serif text-2xl font-bold text-ink mb-6">
            Avaliações
            <span className="ml-2 text-base font-sans font-normal text-muted">
              ({reviews.length})
            </span>
          </h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border border-[#ebebeb] rounded-card p-5">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="12" height="12" viewBox="0 0 24 24"
                      fill={i < r.rating ? "#141414" : "none"} stroke="#141414" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                  <span className="text-xs text-muted ml-2">{r.client.name?.split(" ")[0]}</span>
                </div>
                {r.comment && <p className="text-sm text-muted font-light">{r.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
