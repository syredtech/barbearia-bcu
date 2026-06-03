"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { haversine, formatDistance } from "@/lib/geo";

interface Servico { id: string; price: number }

interface Venue {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  address: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  servicos: Servico[];
}

type VenueWithDist = Venue & { _distance?: number };
type GeoStatus = "pending" | "granted" | "denied";

interface Props {
  limit?: number;
  searchQuery?: string;
  activeCategory?: string;
}

const PLACEHOLDER_CONFIG: Record<string, { bg: string; accent: string }> = {
  barbearia: { bg: "linear-gradient(160deg, #1c1814 0%, #382d22 100%)", accent: "#b8860b" },
  salao:     { bg: "linear-gradient(160deg, #1c1622 0%, #362840 100%)", accent: "#c8a0b8" },
  spa:       { bg: "linear-gradient(160deg, #121e1c 0%, #1e3830 100%)", accent: "#6aaa96" },
};

function VenueImagePlaceholder({ venue }: { venue: Venue }) {
  const initials = venue.name
    .split(" ").slice(0, 2)
    .map((w) => w[0] ?? "").join("").toUpperCase();
  const { bg, accent } = PLACEHOLDER_CONFIG[venue.category] ?? { bg: "linear-gradient(160deg, #1a1a1a 0%, #303030 100%)", accent: "#888" };
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: bg }}>
      <span
        className="font-serif font-bold select-none tracking-widest text-white/60"
        style={{ fontSize: "clamp(44px, 5vw, 68px)", lineHeight: 1 }}
      >
        {initials}
      </span>
      <div className="h-px w-8 rounded-full" style={{ background: accent, opacity: 0.8 }} />
    </div>
  );
}

export default function VenueListWithGeo({ limit, searchQuery, activeCategory = "" }: Props) {
  const [venues, setVenues]             = useState<Venue[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus]       = useState<GeoStatus>("pending");
  const [loading, setLoading]           = useState(true);

  function requestGeo() {
    setGeoStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus("granted"); },
      () => setGeoStatus("denied"),
      { timeout: 10000 }
    );
  }

  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((d) => { setVenues(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus("granted"); },
        () => setGeoStatus("denied"),
        { timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setGeoStatus("denied");
    }
  }, []);

  const processed = useMemo<VenueWithDist[]>(() => {
    let result: VenueWithDist[] = [...venues];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) => v.name.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q) || v.address?.toLowerCase().includes(q)
      );
    }

    if (activeCategory) result = result.filter((v) => v.category === activeCategory);

    if (userLocation) {
      result = result.map((v) => ({
        ...v,
        _distance: v.latitude != null && v.longitude != null
          ? haversine(userLocation.lat, userLocation.lng, v.latitude, v.longitude)
          : Infinity,
      }));
      result.sort((a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity));
    }

    if (limit) result = result.slice(0, limit);
    return result;
  }, [venues, userLocation, searchQuery, activeCategory, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="w-full aspect-video rounded-[12px] bg-[#f0f0f0] mb-3" />
            <div className="h-4 bg-[#f0f0f0] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[#f0f0f0] rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Geo status */}
      <div className="h-6 mb-3 flex items-center">
        {geoStatus === "pending" && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            A obter localização…
          </span>
        )}
        {geoStatus === "granted" && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted border border-[#ebebeb] rounded-pill px-3 py-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Ordenados por proximidade
          </span>
        )}
        {geoStatus === "denied" && (
          <button
            onClick={requestGeo}
            className="inline-flex items-center gap-1.5 text-xs text-muted border border-[#e0dbd4] rounded-pill px-3 py-1 hover:border-ink hover:text-ink transition-all duration-200"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Ativar localização
          </button>
        )}
      </div>

      {processed.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted text-sm">Nenhum estabelecimento encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {processed.map((venue) => (
            <Link
              key={venue.id}
              href={`/estabelecimentos/${venue.slug}`}
              className="group block cursor-pointer"
            >
              <div className="relative w-full aspect-video rounded-[12px] overflow-hidden mb-3 bg-[#f5f5f5]">
                {venue.imageUrl ? (
                  <Image
                    src={venue.imageUrl}
                    alt={venue.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.04]">
                    <VenueImagePlaceholder venue={venue} />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif font-bold text-ink text-[15px] leading-snug">
                    {venue.name}
                  </h3>
                  {venue._distance !== undefined && venue._distance !== Infinity && (
                    <span className="text-xs text-muted shrink-0 mt-0.5">
                      {formatDistance(venue._distance)}
                    </span>
                  )}
                </div>
                <p className="text-muted text-sm mt-0.5 leading-snug">
                  {venue.address ?? venue.category}
                </p>
                {venue.servicos.length > 0 && Math.min(...venue.servicos.map((s) => s.price)) > 0 && (
                  <p className="text-ink text-sm font-medium mt-1.5">
                    A partir de{" "}
                    {Math.min(...venue.servicos.map((s) => s.price)).toLocaleString("pt-CV")} ECV
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
