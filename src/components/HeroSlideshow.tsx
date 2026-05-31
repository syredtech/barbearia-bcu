"use client";
import { useEffect, useState } from "react";

type Slide =
  | { gradient: string; src?: undefined }
  | { src: string; alt: string; gradient?: undefined };

const SLIDES: Slide[] = [
  { src: "/hero/hero-1.jpg",  alt: "Barbearia" },
  { src: "/hero/hero-2.jpg",  alt: "Barbearia" },
  { src: "/hero/hero-4.png",  alt: "Barbearia" },
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
      className="absolute inset-0 hidden lg:block pointer-events-none"
      aria-hidden="true"
    >
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

      {/* Gradiente — funde com bg-[#f7f4f0] para legibilidade do texto */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to right, #f7f4f0 0%, #f7f4f0 25%, rgba(247,244,240,0.85) 38%, rgba(247,244,240,0.4) 54%, rgba(247,244,240,0.05) 68%, transparent 80%)",
        }}
      />

      {/* Indicadores */}
      <div className="absolute bottom-4 right-5 flex gap-1.5 z-20">
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
