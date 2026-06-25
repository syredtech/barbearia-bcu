import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const venue = await prisma.venue.findUnique({
    where: { ownerId: session.user.id },
    select: {
      id: true, slug: true, name: true, description: true,
      category: true, address: true, phone: true, imageUrl: true,
      latitude: true, longitude: true, status: true,
      subscriptionStatus: true, subscriptionExpiresAt: true,
      scheduleStart: true, scheduleEnd: true, slotDuration: true,
      breakStart: true, breakEnd: true, break2Start: true, break2End: true,
      closedDays: true, createdAt: true, updatedAt: true,
      servicos: { select: { id: true, name: true, description: true, duration: true, price: true } },
    },
  });

  if (
    venue &&
    venue.subscriptionExpiresAt &&
    venue.subscriptionExpiresAt < new Date() &&
    venue.subscriptionStatus !== "expired"
  ) {
    await prisma.venue.update({ where: { id: venue.id }, data: { subscriptionStatus: "expired" } });
    return NextResponse.json({ ...venue, subscriptionStatus: "expired" });
  }

  return NextResponse.json(venue);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (session.user.role === "owner") {
    return NextResponse.json({ error: "Já é owner." }, { status: 400 });
  }

  if (!(await rateLimit(`owner:venue-create:${session.user.id}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { name, slug, category, description, address, phone, latitude, longitude } = body;

  if (!name || typeof name !== "string" || !name.trim() || !slug) {
    return NextResponse.json({ error: "Nome e URL são obrigatórios." }, { status: 400 });
  }

  if (latitude != null) {
    const latNum = Number(latitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return NextResponse.json({ error: "Latitude inválida (deve estar entre -90 e 90)." }, { status: 400 });
    }
  }
  if (longitude != null) {
    const lngNum = Number(longitude);
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return NextResponse.json({ error: "Longitude inválida (deve estar entre -180 e 180)." }, { status: 400 });
    }
  }

  if (typeof name !== "string" || name.trim().length > 100) {
    return NextResponse.json({ error: "Nome inválido (máx. 100 caracteres)." }, { status: 400 });
  }
  if (/[<>]/.test(name)) {
    return NextResponse.json({ error: "Nome contém caracteres inválidos." }, { status: 400 });
  }
  if (description && (typeof description !== "string" || description.length > 500)) {
    return NextResponse.json({ error: "Descrição inválida (máx. 500 caracteres)." }, { status: 400 });
  }
  if (description && /[<>]/.test(description)) {
    return NextResponse.json({ error: "Descrição contém caracteres inválidos." }, { status: 400 });
  }
  if (address && (typeof address !== "string" || address.length > 200)) {
    return NextResponse.json({ error: "Endereço inválido (máx. 200 caracteres)." }, { status: 400 });
  }
  if (address && /[<>]/.test(address)) {
    return NextResponse.json({ error: "Endereço contém caracteres inválidos." }, { status: 400 });
  }
  if (phone && (typeof phone !== "string" || phone.length > 30)) {
    return NextResponse.json({ error: "Telefone inválido (máx. 30 caracteres)." }, { status: 400 });
  }
  if (phone && /[<>]/.test(phone)) {
    return NextResponse.json({ error: "Telefone contém caracteres inválidos." }, { status: 400 });
  }

  const allowedCategories = ["barbearia", "salao", "spa"];
  if (category && !allowedCategories.includes(category)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const safeSlug = slug?.toLowerCase().replace(/[^a-z0-9-]/g, "").substring(0, 100);
  if (!safeSlug || safeSlug.length < 3) {
    return NextResponse.json({ error: "Slug inválido." }, { status: 400 });
  }

  // Atomic: create venue first (unique constraints are the gate), then promote role
  let venue;
  try {
    venue = await prisma.$transaction(async (tx) => {
      const created = await tx.venue.create({
        data: {
          name: name.trim(), slug: safeSlug, category, description, address, phone,
          latitude: latitude != null ? Number(latitude) : null,
          longitude: longitude != null ? Number(longitude) : null,
          ownerId: session.user.id,
        },
        select: {
          id: true, slug: true, name: true, description: true,
          category: true, address: true, phone: true, imageUrl: true,
          latitude: true, longitude: true, status: true, createdAt: true,
        },
      });
      await tx.user.update({ where: { id: session.user.id }, data: { role: "owner" } });
      return created;
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      const target: string = err?.meta?.target ?? "";
      if (target.includes("slug")) return NextResponse.json({ error: "Esta URL já está em uso." }, { status: 409 });
      if (target.includes("ownerId")) return NextResponse.json({ error: "Você já tem um estabelecimento cadastrado." }, { status: 409 });
    }
    console.error("[owner/venue] Erro ao criar estabelecimento:", err);
    return NextResponse.json({ error: "Erro ao criar estabelecimento. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json(venue, { status: 201 });
}
