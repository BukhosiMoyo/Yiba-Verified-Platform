/**
 * Diagnostic script to check user counts in the database
 * Run with: npx tsx scripts/check-user-counts.ts
 */

import { prisma } from "../src/lib/prisma";

async function checkUserCounts() {
  try {
    console.log("🔍 Checking user counts in database...\n");

    // Total users (including deleted)
    const totalUsers = await prisma.user.count({});
    console.log(`📊 Total users (including deleted): ${totalUsers}`);

    // Non-deleted users
    const nonDeletedUsers = await prisma.user.count({
      where: { deleted_at: null },
    });
    console.log(`✅ Non-deleted users: ${nonDeletedUsers}`);

    // Deleted users
    const deletedUsers = await prisma.user.count({
      where: { deleted_at: { not: null } },
    });
    console.log(`❌ Deleted users: ${deletedUsers}`);

    // Users by role (non-deleted)
    console.log("\n📋 Non-deleted users by role:");
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      where: { deleted_at: null },
      _count: true,
    });
    usersByRole.forEach((group) => {
      console.log(`   ${group.role}: ${group._count}`);
    });

    // Users by status (non-deleted)
    console.log("\n📋 Non-deleted users by status:");
    const usersByStatus = await prisma.user.groupBy({
      by: ["status"],
      where: { deleted_at: null },
      _count: true,
    });
    usersByStatus.forEach((group) => {
      console.log(`   ${group.status}: ${group._count}`);
    });

    // Check if there are any users with institution_id
    const usersWithInstitution = await prisma.user.count({
      where: {
        deleted_at: null,
        institution_id: { not: null },
      },
    });
    console.log(`\n🏢 Non-deleted users with institution: ${usersWithInstitution}`);

    const usersWithoutInstitution = await prisma.user.count({
      where: {
        deleted_at: null,
        institution_id: null,
      },
    });
    console.log(`🏢 Non-deleted users without institution: ${usersWithoutInstitution}`);

    // Sample of recent users
    console.log("\n📝 Sample of 5 most recent non-deleted users:");
    const recentUsers = await prisma.user.findMany({
      where: { deleted_at: null },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        deleted_at: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      take: 5,
    });
    recentUsers.forEach((user, idx) => {
      console.log(
        `   ${idx + 1}. ${user.first_name} ${user.last_name} (${user.email}) - ${user.role} - ${user.status} - Created: ${user.created_at.toISOString()}`
      );
    });

    console.log("\n✅ Check complete!");
  } catch (error) {
    console.error("❌ Error checking user counts:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserCounts();
