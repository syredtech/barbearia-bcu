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
  if (!(await rateLimit(`owner:perfil-get:${session.user.id}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
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

  if (!(await rateLimit(`owner:perfil:${session.user.id}`, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { imageUrl, description, address, phone } = rawBody;

  if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl inválido." }, { status: 400 });
  }
  if (description !== undefined && description !== null && typeof description !== "string") {
    return NextResponse.json({ error: "Descrição inválida." }, { status: 400 });
  }
  if (address !== undefined && address !== null && typeof address !== "string") {
    return NextResponse.json({ error: "Endereço inválido." }, { status: 400 });
  }
  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    return NextResponse.json({ error: "Telefone inválido." }, { status: 400 });
  }
  if (imageUrl && /[<>"']/.test(imageUrl)) {
    return NextResponse.json({ error: "imageUrl contém caracteres inválidos." }, { status: 400 });
  }
  if (imageUrl && !imageUrl.startsWith("https://")) {
    return NextResponse.json({ error: "imageUrl deve começar com https://." }, { status: 400 });
  }
  if (imageUrl) {
    try {
      const urlObj = new URL(imageUrl);
      if (/^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1|0\.0\.0\.0)/.test(urlObj.hostname)) {
        return NextResponse.json({ error: "imageUrl inválida." }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "imageUrl inválida." }, { status: 400 });
    }
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

  const venue = await prisma.venue.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
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
