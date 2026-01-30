/**
 * Debug Review History
 * 
 * This script checks what audit logs are being returned for a readiness record
 * and verifies that all users belong to the same institution.
 * 
 * Run with: npx tsx scripts/debug-review-history.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugReviewHistory() {
  console.log("🔍 Debugging Review History...\n");

  // Get a readiness record that has been submitted
  const readiness = await prisma.readiness.findFirst({
    where: {
      deleted_at: null,
      readiness_status: {
        notIn: ["NOT_STARTED", "IN_PROGRESS"],
      },
    },
    include: {
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
        },
      },
    },
  });

  if (!readiness) {
    console.log("No submitted readiness records found.");
    return;
  }

  console.log(`📋 Readiness Record: ${readiness.readiness_id}`);
  console.log(`   Institution: ${readiness.institution?.trading_name || readiness.institution?.legal_name} (${readiness.institution_id})`);
  console.log(`   Status: ${readiness.readiness_status}\n`);

  // Get the audit logs for this readiness (same query as the API)
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entity_type: "READINESS", entity_id: readiness.readiness_id },
      ],
      AND: {
        OR: [
          { institution_id: readiness.institution_id },
          { institution_id: null },
        ],
      },
    },
    include: {
      changedBy: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          institution_id: true,
        },
      },
      institution: {
        select: {
          legal_name: true,
          trading_name: true,
        },
      },
    },
    orderBy: {
      changed_at: "desc",
    },
    take: 20,
  });

  console.log(`📝 Found ${auditLogs.length} audit logs:\n`);

  for (const log of auditLogs) {
    const userName = `${log.changedBy?.first_name} ${log.changedBy?.last_name}`;
    const userRole = log.changedBy?.role;
    const userInstitutionId = log.changedBy?.institution_id;
    const logInstitutionId = log.institution_id;
    const logInstitutionName = log.institution?.trading_name || log.institution?.legal_name;

    console.log(`  - ${userName} (${userRole})`);
    console.log(`    Log institution_id: ${logInstitutionId} (${logInstitutionName || 'N/A'})`);
    console.log(`    User institution_id: ${userInstitutionId}`);
    console.log(`    Entity: ${log.entity_type} | ${log.entity_id}`);
    console.log(`    Change: ${log.field_name} = ${log.new_value}`);
    console.log(`    Date: ${log.changed_at}`);
    console.log("");
  }

  // Check if all institution users belong to the same institution
  const institutionUsers = auditLogs.filter(log => log.institution_id !== null);
  const uniqueInstitutions = new Set(institutionUsers.map(log => log.institution_id));

  console.log("📊 Summary:");
  console.log(`  - Total logs: ${auditLogs.length}`);
  console.log(`  - Institution logs: ${institutionUsers.length}`);
  console.log(`  - QCTO logs: ${auditLogs.length - institutionUsers.length}`);
  console.log(`  - Unique institutions in logs: ${uniqueInstitutions.size}`);

  if (uniqueInstitutions.size > 1) {
    console.log("\n⚠️  WARNING: Multiple institutions found in audit logs!");
    console.log("   Institutions:", Array.from(uniqueInstitutions));
  } else if (uniqueInstitutions.size === 1) {
    const instId = Array.from(uniqueInstitutions)[0];
    if (instId === readiness.institution_id) {
      console.log("\n✅ All institution logs match the readiness's institution.");
    } else {
      console.log("\n❌ Institution mismatch! Log institution doesn't match readiness institution.");
    }
  }

  // Check for users with same name but different institutions
  console.log("\n\n🔍 Checking all users named 'Maria Sithole' or 'Themba Johnson'...\n");
  
  const usersToCheck = await prisma.user.findMany({
    where: {
      OR: [
        { first_name: "Maria", last_name: "Sithole" },
        { first_name: "Themba", last_name: "Johnson" },
      ],
    },
    include: {
      institution: {
        select: {
          legal_name: true,
          trading_name: true,
        },
      },
    },
  });

  for (const user of usersToCheck) {
    console.log(`  - ${user.first_name} ${user.last_name}`);
    console.log(`    Role: ${user.role}`);
    console.log(`    Institution: ${user.institution?.trading_name || user.institution?.legal_name || 'None'} (${user.institution_id})`);
    console.log("");
  }
}

debugReviewHistory()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
