import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const venue = await prisma.venue.findUnique({
    where: { ownerId: session.user.id },
    select: { slug: true, name: true, imageUrl: true, description: true, address: true, phone: true },
  });
  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });
  return NextResponse.json(venue);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!rateLimit(`owner:perfil:${session.user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  let rawBody: Record<string, unknown>;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { imageUrl, description, address, phone } = rawBody;

  if (imageUrl && !imageUrl.startsWith("https://")) {
    return NextResponse.json({ error: "imageUrl deve começar com https://." }, { status: 400 });
  }
  if (imageUrl && imageUrl.length > 500) {
    return NextResponse.json({ error: "URL de imagem inválida (máx. 500 caracteres)." }, { status: 400 });
  }
  if (description && description.length > 500) {
    return NextResponse.json({ error: "Descrição inválida (máx. 500 caracteres)." }, { status: 400 });
  }
  if (address && address.length > 200) {
    return NextResponse.json({ error: "Endereço inválido (máx. 200 caracteres)." }, { status: 400 });
  }
  if (phone && phone.length > 30) {
    return NextResponse.json({ error: "Telefone inválido (máx. 30 caracteres)." }, { status: 400 });
  }
  if (description && /[<>]/.test(description)) {
    return NextResponse.json({ error: "Descrição contém caracteres inválidos." }, { status: 400 });
  }
  if (address && /[<>]/.test(address)) {
    return NextResponse.json({ error: "Endereço contém caracteres inválidos." }, { status: 400 });
  }
  if (phone && /[<>]/.test(phone)) {
    return NextResponse.json({ error: "Telefone contém caracteres inválidos." }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });

  const updateData: Record<string, string | null> = {};
  if ("imageUrl" in rawBody) updateData.imageUrl = imageUrl || null;
  if ("description" in rawBody) updateData.description = description || null;
  if ("address" in rawBody) updateData.address = address || null;
  if ("phone" in rawBody) updateData.phone = phone || null;

  const updated = await prisma.venue.update({
    where: { id: venue.id },
    data: updateData,
    select: { slug: true, name: true, imageUrl: true, description: true, address: true, phone: true },
  });

  return NextResponse.json({ ok: true, venue: updated });
}
