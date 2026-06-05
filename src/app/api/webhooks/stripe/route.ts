import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Configuração incompleta." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Webhook inválido." }, { status: 400 });
  }

  // Idempotency: atomic insert — handles concurrent redeliveries safely
  try {
    await prisma.webhookEvent.create({ data: { id: event.id } });
  } catch {
    return NextResponse.json({ received: true });
  }

  // Cleanup old events (older than 30 days) — fire and forget
  prisma.webhookEvent.deleteMany({
    where: { processedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  }).catch(() => {});

  const getVenueId = (obj: Stripe.Subscription | Stripe.Invoice) =>
    (obj.metadata as Record<string, string>)?.venueId ||
    (obj as any).customer_metadata?.venueId;

  const periodEnd = (sub: any): Date | undefined => {
    const ts = sub.current_period_end;
    return ts ? new Date(ts * 1000) : undefined;
  };

  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) break;
      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const venueId = getVenueId(sub);
      if (venueId) {
        await prisma.venue.update({
          where: { id: venueId },
          data: {
            subscriptionStatus: "active",
            stripeSubscriptionId: sub.id,
            ...(periodEnd(sub) && { subscriptionExpiresAt: periodEnd(sub) }),
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) break;
      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const venueId = getVenueId(sub);
      if (venueId) {
        await prisma.venue.update({
          where: { id: venueId },
          data: { subscriptionStatus: "past_due" },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const venueId = getVenueId(sub);
      if (venueId) {
        await prisma.venue.update({
          where: { id: venueId },
          data: {
            subscriptionStatus: "canceled",
            subscriptionExpiresAt: new Date(),
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const venueId = getVenueId(sub);
      if (venueId) {
        await prisma.venue.update({
          where: { id: venueId },
          data: {
            subscriptionStatus: sub.status === "active" ? "active" : sub.status,
            ...(periodEnd(sub) && { subscriptionExpiresAt: periodEnd(sub) }),
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
