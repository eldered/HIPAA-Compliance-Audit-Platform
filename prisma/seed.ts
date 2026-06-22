import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Development seed: creates a demo user (Starter plan) with a workspace.
 * Run with: npm run db:seed
 */
async function main() {
  const email = "demo@vivavault.shop";
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Demo Manager",
      companyName: "Bright Smile Dental",
      plan: "STARTER",
      workspaces: {
        create: {
          companyName: "Bright Smile Dental",
          industry: "Dental Practice",
          employeeCount: 24,
          complianceNotes: "Has written policies; no formal risk assessment yet.",
        },
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded user ${user.email} (password: demo1234)`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
