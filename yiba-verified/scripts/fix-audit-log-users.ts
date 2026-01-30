/**
 * Fix Audit Log User Mismatch
 * 
 * This script removes audit logs where:
 * - Entity type is READINESS
 * - The user who made the change belongs to a DIFFERENT institution than the readiness
 * - AND the user is NOT a QCTO/Platform user
 * 
 * These are invalid audit logs created by corrupted seed data.
 * 
 * Run with: npx tsx scripts/fix-audit-log-users.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixAuditLogUsers() {
  console.log("🔧 Starting audit log user mismatch fix...\n");

  // 1. Get all readiness records with their institution_id
  const allReadiness = await prisma.readiness.findMany({
    select: {
      readiness_id: true,
      institution_id: true,
    },
  });
  const readinessToInstitution = new Map(
    allReadiness.map((r) => [r.readiness_id, r.institution_id])
  );
  console.log(`Loaded ${allReadiness.length} readiness records.\n`);

  // 2. Get all READINESS audit logs with user info
  const readinessAuditLogs = await prisma.auditLog.findMany({
    where: {
      entity_type: "READINESS",
    },
    include: {
      changedBy: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          role: true,
          institution_id: true,
        },
      },
    },
  });

  console.log(`Found ${readinessAuditLogs.length} READINESS audit logs.\n`);

  // 3. Identify and delete invalid logs
  const QCTO_ROLES = ["QCTO_SUPER_ADMIN", "QCTO_ADMIN", "QCTO_REVIEWER", "QCTO_AUDITOR", "QCTO_VIEWER", "PLATFORM_ADMIN"];
  
  let deletedCount = 0;
  let validCount = 0;
  let orphanedCount = 0;

  for (const log of readinessAuditLogs) {
    const readinessInstitutionId = readinessToInstitution.get(log.entity_id);
    
    if (!readinessInstitutionId) {
      // Orphaned log - readiness doesn't exist
      orphanedCount++;
      continue;
    }

    const user = log.changedBy;
    if (!user) {
      // No user found - skip
      continue;
    }

    const isQctoUser = QCTO_ROLES.includes(user.role);
    
    if (isQctoUser) {
      // QCTO users can review any readiness - this is valid
      validCount++;
      continue;
    }

    // Institution user - check if they belong to the correct institution
    if (user.institution_id === readinessInstitutionId) {
      // Correct - user belongs to the same institution as the readiness
      validCount++;
    } else {
      // INVALID - user from a different institution made a change to this readiness
      // This is corrupted seed data - delete it
      console.log(`  ❌ Deleting: ${user.first_name} ${user.last_name} (${user.institution_id}) changed readiness from ${readinessInstitutionId}`);
      
      await prisma.auditLog.delete({
        where: { audit_id: log.audit_id },
      });
      deletedCount++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`  - Valid logs kept: ${validCount}`);
  console.log(`  - Invalid logs deleted: ${deletedCount}`);
  console.log(`  - Orphaned logs: ${orphanedCount}`);
  console.log("\n✅ Done!");
}

fixAuditLogUsers()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
