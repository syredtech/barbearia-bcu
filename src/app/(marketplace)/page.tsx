import Link from "next/link";
import VenueListWithGeo from "@/components/VenueListWithGeo";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="max-w-content mx-auto px-6 pt-24 pb-24">
        <div className="max-w-[720px]">
          <h1 className="hero-title font-serif font-bold text-ink fade-up">
            Agende com<br />
            simplicidade.
          </h1>
          <p className="mt-7 text-muted text-lg font-light max-w-[440px] fade-up-1">
            Os melhores profissionais de Cabo Verde, ao alcance de um toque.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 fade-up-2">
            <Link
              href="/estabelecimentos"
              className="bg-ink text-white px-7 py-3.5 rounded-pill text-sm font-medium
                         hover:bg-[#333] transition-all duration-200"
            >
              Explorar estabelecimentos
            </Link>
            <Link
              href="/parceiros"
              className="border border-ink text-ink px-7 py-3.5 rounded-pill text-sm font-medium
                         hover:bg-ink hover:text-white transition-all duration-200"
            >
              Registar o meu negócio
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-content mx-auto px-6">
        <div className="divider" />
      </div>

      {/* Nearby venues */}
      <section className="max-w-content mx-auto px-6 py-20">
        <h2 className="font-serif text-3xl font-bold text-ink mb-8">
          Perto de si
        </h2>
        <VenueListWithGeo limit={6} />
      </section>
    </main>
  );
}
