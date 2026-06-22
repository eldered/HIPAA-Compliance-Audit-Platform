import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { getStripe } from "@/lib/stripe/client";
import { reduceStripeEvent } from "@/lib/stripe/webhook-reducer";
import { fail, ok } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

/**
 * Stripe webhook handler (R7.2, R7.5).
 * - Verifies the signature.
 * - Dedupes by event id (idempotent).
 * - Applies the reducer's PlanChange to the user + payment record.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return fail("Missing signature", 400);

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    logger.error("Stripe signature verification failed", { err: String(err) });
    return fail("Invalid signature", 400);
  }

  // Idempotency: skip events we've already processed (R7.5).
  const already = await prisma.processedWebhookEvent.findUnique({ where: { id: event.id } });
  if (already) return ok({ received: true, duplicate: true });

  const change = reduceStripeEvent(event as unknown as Parameters<typeof reduceStripeEvent>[0]);

  if (change) {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: change.stripeCustomerId },
      select: { id: true },
    });

    if (user) {
      await prisma.$transaction(async (tx) => {
        // Update plan immediately unless it's a deferred downgrade.
        if (change.plan && !change.downgradeAtPeriodEnd) {
          await tx.user.update({ where: { id: user.id }, data: { plan: change.plan } });
        }
        await tx.payment.create({
          data: {
            userId: user.id,
            stripeCustomerId: change.stripeCustomerId,
            stripeSubscriptionId: change.subscriptionId,
            plan: change.plan ?? "FREE_TRIAL",
            status: change.status,
          },
        });
      });
    } else {
      logger.warn("Webhook for unknown customer", { customer: change.stripeCustomerId });
    }
  }

  await prisma.processedWebhookEvent.create({ data: { id: event.id, type: event.type } });

  return ok({ received: true });
}
