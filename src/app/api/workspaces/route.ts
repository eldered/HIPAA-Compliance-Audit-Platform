import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { fail, ok, unauthorized } from "@/lib/utils/api";

const createWorkspaceSchema = z.object({
  companyName: z.string().min(1, "Practice name is required").max(200),
  industry: z.string().max(120).optional(),
  employeeCount: z.number().int().positive().max(100_000).optional(),
  complianceNotes: z.string().max(2000).optional(),
});

/** Create a workspace for the onboarding wizard (R2). */
export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422, "VALIDATION");
  }

  const workspace = await prisma.workspace.create({
    data: {
      userId,
      companyName: parsed.data.companyName,
      industry: parsed.data.industry ?? null,
      employeeCount: parsed.data.employeeCount ?? null,
      complianceNotes: parsed.data.complianceNotes ?? null,
    },
  });

  return ok({ workspace }, { status: 201 });
}

/** List the current user's workspaces. */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const workspaces = await prisma.workspace.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return ok({ workspaces });
}
