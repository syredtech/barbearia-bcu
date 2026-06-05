import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      servicos: true,
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { name, slug, category, description, address, phone, latitude, longitude } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Nome e URL são obrigatórios." }, { status: 400 });
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

  const existing = await prisma.venue.findUnique({ where: { slug: safeSlug } });
  if (existing) {
    return NextResponse.json({ error: "Esta URL já está em uso." }, { status: 409 });
  }

  const alreadyHasVenue = await prisma.venue.findUnique({
    where: { ownerId: session.user.id },
  });
  if (alreadyHasVenue) {
    return NextResponse.json({ error: "Você já tem um estabelecimento cadastrado." }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: "owner" },
  });

  const venue = await prisma.venue.create({
    data: {
      name, slug: safeSlug, category, description, address, phone,
      latitude: latitude != null && !isNaN(Number(latitude)) ? Number(latitude) : null,
      longitude: longitude != null && !isNaN(Number(longitude)) ? Number(longitude) : null,
      ownerId: session.user.id,
    },
    select: {
      id: true, slug: true, name: true, description: true,
      category: true, address: true, phone: true, imageUrl: true,
      latitude: true, longitude: true, status: true, createdAt: true,
    },
  });

  return NextResponse.json(venue, { status: 201 });
}
