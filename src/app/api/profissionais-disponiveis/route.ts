import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toStr(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function generateSlots(
  start: string, end: string, duration: number,
  breakStart?: string | null, breakEnd?: string | null,
  break2Start?: string | null, break2End?: string | null,
): string[] {
  const endMin  = toMin(end);
  const bsMin   = breakStart  ? toMin(breakStart)  : null;
  const beMin   = breakEnd    ? toMin(breakEnd)    : null;
  const bs2Min  = break2Start ? toMin(break2Start) : null;
  const be2Min  = break2End   ? toMin(break2End)   : null;
  const slots: string[] = [];
  let cur = toMin(start);
  while (cur + duration <= endMin) {
    if (bsMin !== null && beMin !== null && cur >= bsMin && cur < beMin) { cur = beMin; continue; }
    if (bs2Min !== null && be2Min !== null && cur >= bs2Min && cur < be2Min) { cur = be2Min; continue; }
    slots.push(toStr(cur));
    cur += duration;
  }
  return slots;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await rateLimit(`profissionais:${ip}`, 30, 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const date     = searchParams.get("date");
  const time     = searchParams.get("time");
  const allowedCategories = ["barbearia", "salao", "spa"];
  const rawCategory = searchParams.get("category");
  const category = rawCategory && allowedCategories.includes(rawCategory) ? rawCategory : null;
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  const lat = rawLat ? parseFloat(rawLat) : null;
  const lng = rawLng ? parseFloat(rawLng) : null;

  if (!date || !time) {
    return NextResponse.json({ error: "date e time são obrigatórios." }, { status: 400 });
  }

  if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
    return NextResponse.json({ error: "Latitude inválida." }, { status: 400 });
  }
  if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) {
    return NextResponse.json({ error: "Longitude inválida." }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date + "T12:00:00"))) {
    return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  if (date < today) {
    return NextResponse.json({ error: "Não é possível consultar datas passadas." }, { status: 400 });
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: "Hora inválida." }, { status: 400 });
  }

  const weekday = new Date(date + "T12:00:00").getDay();

  const venues = await prisma.venue.findMany({
    where: {
      status: "approved",
      subscriptionStatus: "active",
      subscriptionExpiresAt: { gt: new Date() },
      ...(category ? { category } : {}),
    },
    take: 100,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      address: true,
      imageUrl: true,
      latitude: true,
      longitude: true,
      scheduleStart: true,
      scheduleEnd: true,
      slotDuration: true,
      breakStart: true,
      breakEnd: true,
      break2Start: true,
      break2End: true,
      closedDays: true,
      servicos: { select: { id: true, price: true } },
      agendamentos: {
        where: { date, horario: time, status: "confirmed" },
        select: { id: true },
      },
      _count: { select: { funcionarios: true } },
    },
  });

  const available = venues.filter((v) => {
    // Check closed days
    const closed: number[] = (() => { try { return JSON.parse(v.closedDays || "[]"); } catch { return []; } })();
    if (closed.includes(weekday)) return false;

    // Check if requested time is a valid slot
    const slots = generateSlots(
      v.scheduleStart, v.scheduleEnd, v.slotDuration,
      v.breakStart, v.breakEnd, v.break2Start, v.break2End,
    );
    if (!slots.includes(time)) return false;

    // Check capacity: slot available if bookings < number of employees (min 1)
    const capacity = Math.max(1, v._count.funcionarios);
    return v.agendamentos.length < capacity;
  });

  // Sort by distance if user location provided
  type Result = typeof available[0] & { _distance?: number };
  let results: Result[] = available.map((v) => ({
    ...v,
    _distance:
      lat !== null && lng !== null && v.latitude != null && v.longitude != null
        ? haversine(lat, lng, v.latitude, v.longitude)
        : undefined,
  }));

  if (lat !== null && lng !== null) {
    results.sort((a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity));
  }

  // Return top 10, strip agendamentos and internal schedule/location fields
  const top10 = results.slice(0, 10).map(({
    agendamentos: _a,
    latitude: _lat,
    longitude: _lng,
    scheduleStart: _ss,
    scheduleEnd: _se,
    slotDuration: _sd,
    breakStart: _bs,
    breakEnd: _be,
    break2Start: _bs2,
    break2End: _be2,
    closedDays: _cd,
    _count: _c,
    ...rest
  }) => rest);

  return NextResponse.json({ results: top10, total: available.length });
}
