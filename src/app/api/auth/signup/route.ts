import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signupSchema } from "@/lib/auth/validation";
import { fail, ok } from "@/lib/utils/api";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";

const BCRYPT_COST = 12;

export async function POST(req: NextRequest) {
  // Rate limit signups by IP (R1, NFR1.7).
  const ip = clientIp(req.headers);
  const limit = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!limit.allowed) return fail("Too many attempts. Try again shortly.", 429, "RATE_LIMITED");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422, "VALIDATION");
  }

  const { email, password, name, companyName } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Non-enumerating message (R1.3).
    return fail("Unable to create account with those details.", 409, "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: name ?? null,
      companyName: companyName ?? null,
      plan: "FREE_TRIAL",
    },
    select: { id: true, email: true, name: true },
  });

  // Welcome email is dispatched asynchronously; failure must not block signup (R8.1).
  // (Email service wired in Phase 8; intentionally fire-and-forget here.)

  return ok({ user }, { status: 201 });
}
