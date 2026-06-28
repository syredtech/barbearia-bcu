import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });
  return NextResponse.json({ phone: user?.phone ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  let body: { phone?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { phone } = body;

  if (phone !== null && phone !== undefined && phone !== "") {
    if (typeof phone !== "string") {
      return NextResponse.json({ error: "Telefone inválido." }, { status: 400 });
    }
    if (!/^[0-9+\s]{7,15}$/.test(phone.trim())) {
      return NextResponse.json({ error: "Formato de telefone inválido." }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone: phone ? String(phone).trim() : null },
  });

  return NextResponse.json({ ok: true });
}
