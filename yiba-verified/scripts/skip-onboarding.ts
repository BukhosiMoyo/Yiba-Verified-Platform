/**
 * Quick script to skip onboarding for platform admin
 * Run with: npx tsx scripts/skip-onboarding.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Skipping onboarding for admin@yiba.local...\n");

  const result = await prisma.user.update({
    where: { email: "admin@yiba.local" },
    data: {
      onboarding_completed: true,
      onboarding_completed_at: new Date(),
    },
  });

  console.log("✅ Onboarding skipped!");
  console.log(`   User: ${result.email}`);
  console.log(`   Onboarding completed: ${result.onboarding_completed}`);
  console.log("\n💡 You can now log in and access the dashboard directly.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
