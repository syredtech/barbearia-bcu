import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!(await rateLimit(`admin:venue-patch:${session.user.id}`, 60, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedBody: any;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { status } = parsedBody;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  try {
    const venue = await prisma.venue.update({
      where: { id: params.id },
      data: { status },
      select: { id: true, name: true, status: true, updatedAt: true },
    });
    return NextResponse.json(venue);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
