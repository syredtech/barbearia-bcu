import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner")
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (!rateLimit(`owner:notificacoes-get:${session.user.id}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  const notificacoes = await prisma.notificacao.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unread = notificacoes.filter((n) => !n.read).length;
  return NextResponse.json({ notificacoes, unread });
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner")
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  if (!rateLimit(`owner:notificacoes:${session.user.id}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  await prisma.notificacao.updateMany({
    where: { ownerId: session.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
