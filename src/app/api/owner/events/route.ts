import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// 5-second in-memory cache keyed by venueId to reduce DB load when multiple SSE clients share an instance
const countCache = new Map<string, { agCount: number; notifCount: number; at: number }>();
const COUNT_CACHE_TTL = 5000;

async function getCounts(venueId: string, ownerId: string) {
  const now = Date.now();
  const cached = countCache.get(venueId);
  if (cached && now - cached.at < COUNT_CACHE_TTL) return cached;
  const [agCount, notifCount] = await Promise.all([
    prisma.agendamento.count({ where: { venueId } }),
    prisma.notificacao.count({ where: { ownerId } }),
  ]);
  const entry = { agCount, notifCount, at: now };
  countCache.set(venueId, entry);
  return entry;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return new Response("Não autorizado", { status: 401 });
  }
  if (!rateLimit(`owner:events:${session.user.id}`, 20, 60 * 1000)) {
    return new Response("Demasiadas ligações. Aguarde um momento.", { status: 429 });
  }

  const venue = await prisma.venue.findUnique({ where: { ownerId: session.user.id } });
  if (!venue) return new Response("Estabelecimento não encontrado", { status: 404 });

  const ownerId = session.user.id;
  const venueId = venue.id;
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const initial = await getCounts(venueId, ownerId);
      let lastAgCount = initial.agCount;
      let lastNotifCount = initial.notifCount;

      // Initial keepalive
      controller.enqueue(encoder.encode(": ping\n\n"));

      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const { agCount, notifCount } = await getCounts(venueId, ownerId);
          if (agCount !== lastAgCount || notifCount !== lastNotifCount) {
            lastAgCount = agCount;
            lastNotifCount = notifCount;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "update" })}\n\n`));
          }
        } catch { /* ignore transient DB errors */ }
      }, 10000);

      // Close after 15 s — EventSource auto-reconnects
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!closed) { closed = true; try { controller.close(); } catch {} }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearTimeout(timeout);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
