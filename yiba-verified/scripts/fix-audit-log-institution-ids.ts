/**
 * Fix Audit Log Institution IDs
 * 
 * This script fixes audit logs where entity_type is READINESS but the institution_id
 * doesn't match the institution that owns the readiness record.
 * 
 * Run with: npx tsx scripts/fix-audit-log-institution-ids.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixAuditLogInstitutionIds() {
  console.log("🔧 Starting audit log institution_id fix...\n");

  // 1. Find all audit logs with entity_type READINESS
  const readinessAuditLogs = await prisma.auditLog.findMany({
    where: {
      entity_type: "READINESS",
    },
    select: {
      audit_id: true,
      entity_id: true,
      institution_id: true,
      changedBy: {
        select: {
          role: true,
          institution_id: true,
        },
      },
    },
  });

  console.log(`Found ${readinessAuditLogs.length} READINESS audit logs to check.\n`);

  // 2. Get all readiness records to know their correct institution_id
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

  // 3. Check each audit log and fix if needed
  let fixedCount = 0;
  let skippedCount = 0;
  let qctoUserCount = 0;
  let notFoundCount = 0;

  for (const log of readinessAuditLogs) {
    const correctInstitutionId = readinessToInstitution.get(log.entity_id);

    if (!correctInstitutionId) {
      // The readiness doesn't exist - this is an orphaned audit log
      console.log(`  ⚠️  Audit ${log.audit_id}: readiness ${log.entity_id} not found (orphaned log)`);
      notFoundCount++;
      continue;
    }

    // Check if the user who made this change is a QCTO user (no institution)
    const isQctoUser = log.changedBy?.role?.startsWith("QCTO_") || 
                       log.changedBy?.role === "PLATFORM_ADMIN" ||
                       log.changedBy?.institution_id === null;

    if (isQctoUser) {
      // QCTO users should have null institution_id on their audit logs
      if (log.institution_id !== null) {
        await prisma.auditLog.update({
          where: { audit_id: log.audit_id },
          data: { institution_id: null },
        });
        console.log(`  ✅ Fixed QCTO user log ${log.audit_id}: set institution_id to null`);
        fixedCount++;
      } else {
        qctoUserCount++;
      }
    } else {
      // Institution users should have the correct institution_id
      if (log.institution_id !== correctInstitutionId) {
        await prisma.auditLog.update({
          where: { audit_id: log.audit_id },
          data: { institution_id: correctInstitutionId },
        });
        console.log(`  ✅ Fixed log ${log.audit_id}: ${log.institution_id} → ${correctInstitutionId}`);
        fixedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  console.log("\n📊 Summary:");
  console.log(`  - Fixed: ${fixedCount}`);
  console.log(`  - Already correct (institution users): ${skippedCount}`);
  console.log(`  - Already correct (QCTO users): ${qctoUserCount}`);
  console.log(`  - Orphaned (readiness not found): ${notFoundCount}`);
  console.log("\n✅ Done!");
}

fixAuditLogInstitutionIds()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
