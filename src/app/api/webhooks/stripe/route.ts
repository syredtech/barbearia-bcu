import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Webhook inválido." }, { status: 400 });
  }

  // Idempotency check
  const existing = await prisma.webhookEvent.findUnique({ where: { id: event.id } });
  if (existing) return NextResponse.json({ received: true });
  await prisma.webhookEvent.create({ data: { id: event.id } });

  const getVenueId = (obj: Stripe.Subscription | Stripe.Invoice) =>
    (obj.metadata as Record<string, string>)?.venueId ||
    (obj as any).customer_metadata?.venueId;

  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const venueId = getVenueId(sub);
      if (venueId) {
        await prisma.venue.update({
          where: { id: venueId },
          data: {
            subscriptionStatus: "active",
            stripeSubscriptionId: sub.id,
            subscriptionExpiresAt: new Date((sub as any).current_period_end * 1000),
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
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
            subscriptionExpiresAt: new Date((sub as any).current_period_end * 1000),
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
