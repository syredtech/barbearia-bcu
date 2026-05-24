"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
  showCategoryFilter?: boolean;
}

const CATEGORIES = [
  { id: "",           label: "Todos",     symbol: "✦" },
  { id: "barbearia",  label: "Barbearia", symbol: "✂" },
  { id: "salao",      label: "Salão",     symbol: "✿" },
  { id: "spa",        label: "Spa",       symbol: "◈" },
];

function VenueImagePlaceholder({ venue }: { venue: Venue }) {
  const initials = venue.name
    .split(" ").slice(0, 2)
    .map((w) => w[0] ?? "").join("").toUpperCase();
  const bg = venue.category === "barbearia" ? "#141414" : venue.category === "spa" ? "#0f1818" : "#180f0f";
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: bg }}>
      <span className="font-serif text-[52px] font-bold text-white opacity-[0.12] select-none tracking-widest">
        {initials}
      </span>
    </div>
  );
}

export default function VenueListWithGeo({ limit, searchQuery, showCategoryFilter }: Props) {
  const [venues, setVenues]           = useState<Venue[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus]     = useState<GeoStatus>("pending");
  const [loading, setLoading]         = useState(true);
  const [activeCategory, setActiveCategory] = useState("");

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
            <div className="w-full aspect-[4/3] rounded-[12px] bg-[#f0f0f0] mb-3" />
            <div className="h-4 bg-[#f0f0f0] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[#f0f0f0] rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Category filter pills */}
      {showCategoryFilter && (
        <div className="flex gap-16 border-b border-[#ebebeb] mb-8 overflow-x-auto pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center gap-3 pb-6 text-xl font-medium
                border-b-2 -mb-px whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat.id
                    ? "border-ink text-ink"
                    : "border-transparent text-muted hover:text-ink hover:border-[#bbb]"
                }`}
            >
              <span className="text-[44px] leading-none">{cat.symbol}</span>
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Geo status */}
      <div className="h-5 mb-4">
        {geoStatus === "pending" && (
          <p className="text-xs text-muted flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            A obter localização…
          </p>
        )}
        {geoStatus === "granted" && (
          <p className="text-xs text-muted">
            A mostrar os estabelecimentos mais próximos de si
          </p>
        )}
        {geoStatus === "denied" && (
          <p className="text-xs text-muted">
            Active a geolocalização para ver as distâncias
          </p>
        )}
      </div>

      {processed.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted text-sm">Nenhum estabelecimento encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {processed.map((venue) => (
            <Link
              key={venue.id}
              href={`/estabelecimentos/${venue.slug}`}
              className="group block cursor-pointer"
            >
              {/* Image */}
              <div className="w-full aspect-[4/3] rounded-[12px] overflow-hidden mb-3 bg-[#f5f5f5]">
                {venue.imageUrl ? (
                  <img
                    src={venue.imageUrl}
                    alt={venue.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.04]">
                    <VenueImagePlaceholder venue={venue} />
                  </div>
                )}
              </div>

              {/* Info */}
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
                {venue.servicos.length > 0 && (
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
