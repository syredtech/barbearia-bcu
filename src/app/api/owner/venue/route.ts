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
    include: { servicos: true },
  });

  return NextResponse.json(venue);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (session.user.role === "owner") {
    return NextResponse.json({ error: "Já é owner." }, { status: 400 });
  }

  const body = await req.json();
  const { name, slug, category, description, address, phone, latitude, longitude } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Nome e URL são obrigatórios." }, { status: 400 });
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
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(venue, { status: 201 });
}
