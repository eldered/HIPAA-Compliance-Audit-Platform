import type { Plan, PaymentStatus } from "@/types/domain";

/**
 * Pure reducer that maps a Stripe event into the intended account changes.
 * Kept side-effect-free so it is trivially unit-testable (R7.2, R7.4, NFR3.3).
 * The webhook route applies the returned `PlanChange` to the database.
 */
export interface PlanChange {
  /** Stripe customer id the change applies to. */
  stripeCustomerId: string;
  /** New plan to set on the user (null = leave unchanged). */
  plan: Plan | null;
  /** Payment record status. */
  status: PaymentStatus;
  /** Subscription id, if present. */
  subscriptionId: string | null;
  /** Whether downgrade should occur at period end vs immediately. */
  downgradeAtPeriodEnd: boolean;
}

/** Map a Stripe price id to a plan using configured env price ids. */
export function planForPriceId(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL) return "PROFESSIONAL";
  return null;
}

interface MinimalEvent {
  type: string;
  data: {
    object: {
      customer?: string | null;
      subscription?: string | null;
      id?: string | null;
      status?: string | null;
      cancel_at_period_end?: boolean | null;
      items?: { data: Array<{ price?: { id?: string | null } | null }> } | null;
    };
  };
}

/**
 * Reduce a Stripe event to a PlanChange, or null if the event is irrelevant.
 */
export function reduceStripeEvent(event: MinimalEvent): PlanChange | null {
  const obj = event.data.object;
  const stripeCustomerId = obj.customer ?? null;
  if (!stripeCustomerId) return null;

  switch (event.type) {
    case "checkout.session.completed": {
      const priceId = obj.items?.data?.[0]?.price?.id ?? null;
      return {
        stripeCustomerId,
        plan: planForPriceId(priceId),
        status: "ACTIVE",
        subscriptionId: obj.subscription ?? null,
        downgradeAtPeriodEnd: false,
      };
    }
    case "customer.subscription.updated": {
      const priceId = obj.items?.data?.[0]?.price?.id ?? null;
      const cancelAtPeriodEnd = Boolean(obj.cancel_at_period_end);
      const stripeStatus = obj.status ?? "";
      const status: PaymentStatus =
        stripeStatus === "past_due"
          ? "PAST_DUE"
          : stripeStatus === "canceled"
            ? "CANCELED"
            : "ACTIVE";
      return {
        stripeCustomerId,
        plan: cancelAtPeriodEnd ? null : planForPriceId(priceId),
        status,
        subscriptionId: obj.id ?? null,
        downgradeAtPeriodEnd: cancelAtPeriodEnd,
      };
    }
    case "customer.subscription.deleted": {
      return {
        stripeCustomerId,
        plan: "FREE_TRIAL",
        status: "CANCELED",
        subscriptionId: obj.id ?? null,
        downgradeAtPeriodEnd: false,
      };
    }
    case "invoice.payment_failed": {
      return {
        stripeCustomerId,
        plan: null,
        status: "PAST_DUE",
        subscriptionId: obj.subscription ?? null,
        downgradeAtPeriodEnd: false,
      };
    }
    default:
      return null;
  }
}
