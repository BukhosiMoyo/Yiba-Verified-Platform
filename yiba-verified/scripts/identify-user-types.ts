/**
 * Identify which users are demo/test vs production
 * Run with: npx tsx scripts/identify-user-types.ts
 */

import { prisma } from "../src/lib/prisma";

async function identifyUserTypes() {
  try {
    console.log("🔍 Identifying user types...\n");

    // Get all users
    const allUsers = await prisma.user.findMany({
      where: { deleted_at: null },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
      },
      orderBy: { created_at: "desc" },
    });

    console.log(`📊 Total non-deleted users: ${allUsers.length}\n`);

    // Categorize users
    const demoUsers = allUsers.filter(u => u.email.includes("@demo.yibaverified.local"));
    const testUsers = allUsers.filter(u => u.email.includes("@test.yibaverified.local"));
    const regularSeedUsers = allUsers.filter(u => 
      u.email.includes("@yibaverified.co.za") || 
      u.email.includes("@yiba.local") ||
      u.email.includes("@testinstitution.co.za")
    );

    console.log("📋 User Categories:\n");
    
    if (demoUsers.length > 0) {
      console.log(`🌐 DEMO USERS (${demoUsers.length}) - From seed.demo.ts:`);
      demoUsers.forEach(u => {
        console.log(`   - ${u.first_name} ${u.last_name} (${u.email}) - ${u.role}`);
      });
      console.log();
    }

    if (testUsers.length > 0) {
      console.log(`🧪 TEST USERS (${testUsers.length}) - Dynamically created test accounts:`);
      testUsers.forEach(u => {
        console.log(`   - ${u.first_name} ${u.last_name} (${u.email}) - ${u.role}`);
      });
      console.log();
    }

    if (regularSeedUsers.length > 0) {
      console.log(`🔧 REGULAR SEED USERS (${regularSeedUsers.length}) - From seed.ts (dev/test accounts):`);
      regularSeedUsers.forEach(u => {
        console.log(`   - ${u.first_name} ${u.last_name} (${u.email}) - ${u.role}`);
      });
      console.log();
    }

    const otherUsers = allUsers.filter(u => 
      !u.email.includes("@demo.yibaverified.local") &&
      !u.email.includes("@test.yibaverified.local") &&
      !u.email.includes("@yibaverified.co.za") &&
      !u.email.includes("@yiba.local") &&
      !u.email.includes("@testinstitution.co.za")
    );

    if (otherUsers.length > 0) {
      console.log(`❓ OTHER USERS (${otherUsers.length}):`);
      otherUsers.forEach(u => {
        console.log(`   - ${u.first_name} ${u.last_name} (${u.email}) - ${u.role}`);
      });
      console.log();
    }

    console.log("\n📝 Summary:");
    console.log(`   Total: ${allUsers.length}`);
    console.log(`   Demo: ${demoUsers.length}`);
    console.log(`   Test: ${testUsers.length}`);
    console.log(`   Regular Seed (dev/test): ${regularSeedUsers.length}`);
    console.log(`   Other: ${otherUsers.length}`);

    console.log("\n✅ Analysis complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

identifyUserTypes();
