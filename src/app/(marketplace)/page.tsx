import VenueListWithGeo from "@/components/VenueListWithGeo";

export default function Home() {
  return (
    <main>
      <section className="max-w-content mx-auto px-6 pt-24 pb-24">
        <div className="max-w-[720px] mb-14">
          <h1 className="hero-title font-serif font-bold text-ink fade-up">
            Agende com<br />
            simplicidade.
          </h1>
          <p className="mt-7 text-muted text-lg font-light max-w-[440px] fade-up-1">
            Os melhores profissionais de Cabo Verde, ao alcance de um toque.
          </p>
        </div>

        <VenueListWithGeo limit={6} />
      </section>
    </main>
  );
}
