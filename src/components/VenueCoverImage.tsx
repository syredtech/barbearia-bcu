"use client";
import { useState } from "react";
import Image from "next/image";

interface Props {
  imageUrl: string | null;
  name: string;
  initials: string;
  bg: string;
  accent: string;
}

export default function VenueCoverImage({ imageUrl, name, initials, bg, accent }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = imageUrl && !failed;

  return (
    <div
      className="relative w-full h-[220px] sm:h-[300px] overflow-hidden"
      style={{ background: showImage ? undefined : bg }}
    >
      {showImage ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <span
            className="font-serif font-bold select-none tracking-widest text-white/60 leading-none"
            style={{ fontSize: "clamp(56px, 8vw, 96px)" }}
          >
            {initials}
          </span>
          <div className="h-px w-10 rounded-full" style={{ background: accent, opacity: 0.8 }} />
        </div>
      )}
    </div>
  );
}
