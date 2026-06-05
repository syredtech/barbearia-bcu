import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, STRIPE_PRICE_ID, obterOuCriarStripeCustomer } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  if (!process.env.NEXTAUTH_URL || !STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Configuração incompleta." }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!rateLimit(`stripe:checkout:${session.user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
  }

  const venue = await prisma.venue.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!venue) {
    return NextResponse.json({ error: "Venue não encontrado." }, { status: 404 });
  }

  if (venue.status !== "approved") {
    return NextResponse.json({ error: "Estabelecimento ainda não aprovado." }, { status: 403 });
  }

  try {
    const customerId = await obterOuCriarStripeCustomer(
      venue.id,
      session.user.email!,
      session.user.name!
    );

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/painel?assinatura=sucesso`,
      cancel_url: `${process.env.NEXTAUTH_URL}/painel`,
      metadata: { venueId: venue.id },
      subscription_data: { metadata: { venueId: venue.id } },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch {
    return NextResponse.json({ error: "Erro ao criar sessão de pagamento." }, { status: 502 });
  }
}
