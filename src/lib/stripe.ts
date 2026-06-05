import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não configurada nas variáveis de ambiente.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";

export async function obterOuCriarStripeCustomer(
  venueId: string,
  email: string,
  nome: string
) {
  const { prisma } = await import("./prisma");

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { stripeCustomerId: true },
  });

  if (venue?.stripeCustomerId) return venue.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    name: nome,
    metadata: { venueId },
  });

  await prisma.venue.update({
    where: { id: venueId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
