import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/client";
import { getEntitlements } from "@/lib/billing/plans";
import { fail, ok, unauthorized } from "@/lib/utils/api";

const subscribeSchema = z.object({
  plan: z.enum(["STARTER", "PROFESSIONAL"]),
});

/** Create a Stripe Checkout session for a paid plan (R7.1). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid plan", 422, "VALIDATION");

  const entitlements = getEntitlements(parsed.data.plan);
  const priceId = entitlements.stripePriceEnv
    ? process.env[entitlements.stripePriceEnv]
    : undefined;
  if (!priceId) return fail("Plan is not purchasable", 400, "NO_PRICE");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true },
  });
  if (!user) return unauthorized();

  const stripe = getStripe();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: user.stripeCustomerId ?? undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    client_reference_id: userId,
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    metadata: { userId, plan: parsed.data.plan },
  });

  return ok({ url: checkout.url });
}
