import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { fail, ok, unauthorized } from "@/lib/utils/api";

/** Get the logged-in user's profile (R2). */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      plan: true,
      stripeCustomerId: true,
    },
  });
  if (!user) return unauthorized();
  return ok({ user });
}

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  companyName: z.string().min(1).max(200).optional(),
});

/** Update profile settings. */
export async function PUT(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 422, "VALIDATION");

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, name: true, companyName: true },
  });
  return ok({ user });
}
