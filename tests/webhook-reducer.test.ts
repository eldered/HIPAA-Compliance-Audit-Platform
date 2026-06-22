import { describe, it, expect, beforeEach } from "vitest";
import { reduceStripeEvent, planForPriceId } from "@/lib/stripe/webhook-reducer";

beforeEach(() => {
  process.env.STRIPE_PRICE_STARTER = "price_starter";
  process.env.STRIPE_PRICE_PROFESSIONAL = "price_pro";
});

describe("planForPriceId", () => {
  it("maps configured price ids to plans", () => {
    expect(planForPriceId("price_starter")).toBe("STARTER");
    expect(planForPriceId("price_pro")).toBe("PROFESSIONAL");
    expect(planForPriceId("price_unknown")).toBeNull();
    expect(planForPriceId(null)).toBeNull();
  });
});

describe("reduceStripeEvent", () => {
  it("activates the plan on checkout completion", () => {
    const change = reduceStripeEvent({
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_1",
          subscription: "sub_1",
          items: { data: [{ price: { id: "price_pro" } }] },
        },
      },
    });
    expect(change).toMatchObject({
      stripeCustomerId: "cus_1",
      plan: "PROFESSIONAL",
      status: "ACTIVE",
      subscriptionId: "sub_1",
      downgradeAtPeriodEnd: false,
    });
  });

  it("defers downgrade when cancel_at_period_end is set", () => {
    const change = reduceStripeEvent({
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_1",
          id: "sub_1",
          status: "active",
          cancel_at_period_end: true,
          items: { data: [{ price: { id: "price_pro" } }] },
        },
      },
    });
    expect(change?.plan).toBeNull();
    expect(change?.downgradeAtPeriodEnd).toBe(true);
  });

  it("marks past_due on failed invoice", () => {
    const change = reduceStripeEvent({
      type: "invoice.payment_failed",
      data: { object: { customer: "cus_1", subscription: "sub_1" } },
    });
    expect(change?.status).toBe("PAST_DUE");
  });

  it("reverts to free trial on subscription deletion", () => {
    const change = reduceStripeEvent({
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_1", id: "sub_1" } },
    });
    expect(change?.plan).toBe("FREE_TRIAL");
    expect(change?.status).toBe("CANCELED");
  });

  it("ignores irrelevant events and events without a customer", () => {
    expect(
      reduceStripeEvent({ type: "ping", data: { object: { customer: "cus_1" } } }),
    ).toBeNull();
    expect(
      reduceStripeEvent({ type: "checkout.session.completed", data: { object: {} } }),
    ).toBeNull();
  });
});
