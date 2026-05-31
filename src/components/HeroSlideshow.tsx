"use client";
import { useEffect, useState } from "react";

// ─── SLIDES ────────────────────────────────────────────────────────────────
// Placeholder: gradients escuros enquanto não há fotografias reais.
//
// Para substituir por fotografia real, trocar o objecto:
//   DE:   { gradient: "..." }
//   PARA: { src: "/hero/hero-1.jpg", alt: "Descrição da imagem" }
//
// Colocar os ficheiros em /public/hero/ (formato WebP, 1920×900 px)
// ──────────────────────────────────────────────────────────────────────────
type Slide =
  | { gradient: string; src?: undefined }
  | { src: string; alt: string; gradient?: undefined };

const SLIDES: Slide[] = [
  { gradient: "linear-gradient(160deg, #2c1f14 0%, #5a3820 50%, #8b5e3c 100%)" },
  { gradient: "linear-gradient(160deg, #1c1a28 0%, #2d2845 50%, #4a3e6b 100%)" },
  { gradient: "linear-gradient(160deg, #121e1c 0%, #1e3428 50%, #2d5c40 100%)" },
  { gradient: "linear-gradient(160deg, #1e1a14 0%, #3d3020 50%, #6b5238 100%)" },
  { gradient: "linear-gradient(160deg, #1a1c1e 0%, #2a3038 50%, #3c4a58 100%)" },
];

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="absolute inset-y-0 right-0 w-[46%] hidden lg:block pointer-events-none"
      aria-hidden="true"
    >
      {/* Fade esquerdo — funde com bg-[#f7f4f0] do hero */}
      <div
        className="absolute inset-y-0 left-0 w-40 z-10"
        style={{ background: "linear-gradient(to right, #f7f4f0, transparent)" }}
      />

      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            background: slide.src
              ? `url(${slide.src}) center/cover no-repeat`
              : slide.gradient,
            opacity: i === current ? 1 : 0,
            transition: "opacity 1s ease-in-out",
          }}
        />
      ))}

      {/* Indicadores */}
      <div className="absolute bottom-4 right-5 flex gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-500"
            style={{
              background: i === current ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
              transform: i === current ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
