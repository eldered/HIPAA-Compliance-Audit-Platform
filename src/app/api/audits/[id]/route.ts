import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { ok, unauthorized, forbidden, notFound } from "@/lib/utils/api";
import { userOwnsAudit } from "@/server/services/authz";

/** Get a single audit with its compliance report (R4, R5). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  if (!(await userOwnsAudit(userId, params.id))) {
    // Distinguish missing vs forbidden without leaking existence.
    const exists = await prisma.audit.count({ where: { id: params.id } });
    return exists ? forbidden() : notFound("Audit");
  }

  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    include: { report: true, documents: { select: { id: true, fileName: true } } },
  });
  if (!audit) return notFound("Audit");

  return ok({ audit });
}
