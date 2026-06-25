import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ShareButton from "@/components/ShareButton";
import type { Metadata } from "next";

const SITE_URL = (process.env.NEXTAUTH_URL ?? "https://belabelo.cv").replace(/\/$/, "");
const CATEGORY_LABEL: Record<string, string> = {
  barbearia: "Barbearia",
  salao: "Cabeleireiro & Penteados",
  spa: "Unhas & Maquilhagem",
};

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const venue = await prisma.venue.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true, category: true, address: true, imageUrl: true, slug: true },
  });
  if (!venue) return {};

  const cat   = CATEGORY_LABEL[venue.category] ?? venue.category;
  const title = `${venue.name} — ${cat}`;
  const desc  = venue.description
    ?? `${venue.name} em ${venue.address ?? "Cabo Verde"}. Agende o seu horário online.`;
  const url   = `${SITE_URL}/estabelecimentos/${venue.slug}`;
  const images = venue.imageUrl
    ? [{ url: venue.imageUrl, width: 1200, height: 630, alt: venue.name }]
    : undefined;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title, description: desc, url, images, type: "website" },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

const COVER_CONFIG: Record<string, { bg: string; accent: string }> = {
  barbearia: { bg: "linear-gradient(160deg, #1c1814 0%, #382d22 100%)", accent: "#b8860b" },
  salao:     { bg: "linear-gradient(160deg, #1c1622 0%, #362840 100%)", accent: "#c8a0b8" },
  spa:       { bg: "linear-gradient(160deg, #121e1c 0%, #1e3830 100%)", accent: "#6aaa96" },
};

export default async function EstabelecimentoPage({
  params,
}: {
  params: { slug: string };
}) {
  const venue = await prisma.venue.findUnique({
    where: { slug: params.slug },
    select: {
      id: true, slug: true, name: true, description: true, category: true,
      address: true, phone: true, imageUrl: true, status: true,
      servicos: { select: { id: true, name: true, description: true, duration: true, price: true } },
    },
  });

  const reviews = venue ? await prisma.review.findMany({
    where: { venueId: venue.id },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  }) : [];

  if (!venue || venue.status !== "approved") notFound();

  const initials = venue.name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
  const { bg, accent } = COVER_CONFIG[venue.category] ?? { bg: "linear-gradient(160deg, #1a1a1a 0%, #303030 100%)", accent: "#888" };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: venue.name,
    description: venue.description ?? undefined,
    url: `${SITE_URL}/estabelecimentos/${venue.slug}`,
    image: venue.imageUrl ?? undefined,
    address: venue.address
      ? { "@type": "PostalAddress", streetAddress: venue.address, addressCountry: "CV" }
      : undefined,
    telephone: venue.phone ?? undefined,
    ...(avgRating !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: reviews.length,
      },
    }),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços",
      itemListElement: venue.servicos.map((s) => ({
        "@type": "Offer",
        name: s.name,
        price: s.price,
        priceCurrency: "CVE",
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\//g, "<\\/") }}
      />
      {/* Cover hero */}
      <div className="relative w-full h-[220px] sm:h-[300px] overflow-hidden" style={{ background: venue.imageUrl ? undefined : bg }}>
        {venue.imageUrl ? (
          <Image src={venue.imageUrl} alt={venue.name} fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <span className="font-serif font-bold select-none tracking-widest text-white/60 leading-none"
              style={{ fontSize: "clamp(56px, 8vw, 96px)" }}>
              {initials}
            </span>
            <div className="h-px w-10 rounded-full" style={{ background: accent, opacity: 0.8 }} />
          </div>
        )}
      </div>

      <main className="max-w-content mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <p className="text-xs text-muted mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Início</Link>
          {" / "}
          <span className="text-ink">{venue.name}</span>
        </p>

        {/* Header */}
        <div className="max-w-[640px] mb-8">
          <span className="text-xs font-medium uppercase tracking-widest text-muted">
            {CATEGORY_LABEL[venue.category] ?? venue.category}
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
          <div className="flex items-center gap-4 mt-5">
            <ShareButton name={venue.name} slug={venue.slug} />
            {avgRating !== null && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                    fill={i < Math.round(avgRating) ? "#F59E0B" : "#e5e7eb"}
                    stroke={i < Math.round(avgRating) ? "#F59E0B" : "#d1d5db"}
                    strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
                <span className="text-xs text-muted ml-1">{avgRating.toFixed(1)} ({reviews.length})</span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="divider mb-8" />

        {/* Services */}
        <h2 className="font-serif text-2xl font-bold text-ink mb-6">Serviços</h2>
        {venue.servicos.length === 0 ? (
          <p className="text-muted text-sm font-light py-6">
            Este estabelecimento ainda não tem serviços disponíveis.
          </p>
        ) : (
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
        )}

        {reviews.length > 0 && (
          <>
            <div className="divider my-8" />
            <h2 className="font-serif text-2xl font-bold text-ink mb-6">
              Avaliações
              <span className="ml-2 text-base font-sans font-normal text-muted">
                ({reviews.length})
              </span>
            </h2>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border border-[#ebebeb] rounded-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                          fill={i < r.rating ? "#F59E0B" : "#e5e7eb"}
                          stroke={i < r.rating ? "#F59E0B" : "#d1d5db"}
                          strokeWidth="1.5">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                      <span className="text-xs text-muted ml-2">{r.client.name?.split(" ")[0]}</span>
                    </div>
                    <span className="text-xs text-muted">
                      {new Date(r.createdAt).toLocaleDateString("pt-CV", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-muted font-light">{r.comment}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
