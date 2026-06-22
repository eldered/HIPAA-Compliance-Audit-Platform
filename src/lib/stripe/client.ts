import Stripe from "stripe";

let stripe: Stripe | null = null;

/** Lazily construct the Stripe client so builds don't require the key. */
export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      // Cast keeps us resilient to the SDK's pinned apiVersion literal across
      // minor upgrades; override via the Stripe dashboard's API version.
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return stripe;
}
