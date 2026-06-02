"use client";
import { useEffect, useState } from "react";

type Slide =
  | { gradient: string; src?: undefined }
  | { src: string; alt: string; gradient?: undefined };

const SLIDES: Slide[] = [
  { src: "/hero/hero-1.webp", alt: "Barbearia" },
  { src: "/hero/hero-2.webp", alt: "Barbearia" },
  { src: "/hero/hero-3.webp", alt: "Barbearia" },
  { src: "/hero/hero-4.webp", alt: "Barbearia" },
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
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    >
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 hero-slide-bg${i === current ? " hero-slide-active" : ""}`}
          style={{
            backgroundImage: slide.src ? `url(${slide.src})` : undefined,
            background: slide.src ? undefined : slide.gradient,
            opacity: i === current ? 1 : 0,
            transition: "opacity 1s ease-in-out",
          }}
        />
      ))}

      {/* Overlay: gradiente top→bottom (mobile) / tint uniforme (desktop) */}
      <div className="absolute inset-0 z-10 hero-tint" />

      {/* Indicadores */}
      <div className="absolute bottom-[230px] lg:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all duration-500"
            style={{
              background: i === current ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)",
              transform: i === current ? "scale(1.25)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
