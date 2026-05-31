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
  { src: "/hero/hero-1.webp", alt: "Barbearia" },
  { src: "/hero/hero-2.jpg",  alt: "Barbearia" },
  { src: "/hero/hero-3.avif", alt: "Barbearia" },
  { src: "/hero/hero-4.webp", alt: "Barbearia" },
  { src: "/hero/hero-5.jpg",  alt: "Barbearia" },
  { src: "/hero/hero-6.jpg",  alt: "Barbearia" },
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
