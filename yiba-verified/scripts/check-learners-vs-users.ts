/**
 * Compare Users vs Learners counts
 * Run with: npx tsx scripts/check-learners-vs-users.ts
 */

import { prisma } from "../src/lib/prisma";

async function compareCounts() {
  try {
    console.log("🔍 Comparing Users vs Learners...\n");

    // Users
    const totalUsers = await prisma.user.count({});
    const nonDeletedUsers = await prisma.user.count({ where: { deleted_at: null } });
    const deletedUsers = await prisma.user.count({ where: { deleted_at: { not: null } } });

    // Learners
    const totalLearners = await prisma.learner.count({});
    const nonDeletedLearners = await prisma.learner.count({ where: { deleted_at: null } });
    const deletedLearners = await prisma.learner.count({ where: { deleted_at: { not: null } } });

    // Learners with user accounts linked
    const learnersWithUsers = await prisma.learner.count({
      where: {
        deleted_at: null,
        user_id: { not: null },
      },
    });

    // Learners without user accounts
    const learnersWithoutUsers = await prisma.learner.count({
      where: {
        deleted_at: null,
        user_id: null,
      },
    });

    console.log("📊 USERS:");
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Non-deleted: ${nonDeletedUsers}`);
    console.log(`   Deleted: ${deletedUsers}`);
    console.log();

    console.log("📚 LEARNERS:");
    console.log(`   Total learners: ${totalLearners}`);
    console.log(`   Non-deleted: ${nonDeletedLearners}`);
    console.log(`   Deleted: ${deletedLearners}`);
    console.log();

    console.log("🔗 LEARNER-USER RELATIONSHIP:");
    console.log(`   Learners WITH user accounts: ${learnersWithUsers}`);
    console.log(`   Learners WITHOUT user accounts: ${learnersWithoutUsers}`);
    console.log();

    // Breakdown by role for users
    console.log("👥 USERS BY ROLE:");
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      where: { deleted_at: null },
      _count: true,
    });
    usersByRole.forEach((group) => {
      console.log(`   ${group.role}: ${group._count}`);
    });
    console.log();

    // Sample of learners
    console.log("📝 Sample of 5 most recent learners:");
    const recentLearners = await prisma.learner.findMany({
      where: { deleted_at: null },
      select: {
        learner_id: true,
        first_name: true,
        last_name: true,
        national_id: true,
        user_id: true,
        institution: {
          select: {
            trading_name: true,
            legal_name: true,
          },
        },
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      take: 5,
    });
    recentLearners.forEach((learner, idx) => {
      const hasUser = learner.user_id ? "✅ Has user account" : "❌ No user account";
      const instName = learner.institution?.trading_name || learner.institution?.legal_name || "Unknown";
      console.log(
        `   ${idx + 1}. ${learner.first_name} ${learner.last_name} (ID: ${learner.national_id}) - ${instName} - ${hasUser}`
      );
    });

    console.log("\n✅ Comparison complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

compareCounts();
