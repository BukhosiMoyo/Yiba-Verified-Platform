/**
 * Simple manual test script for QCTO access helper
 * 
 * This tests the helper function with actual Prisma queries (requires database).
 * 
 * Prerequisites:
 * 1. Run: npx prisma migrate dev --name add_submission_qcto_request_models
 * 2. Ensure database is running and seeded
 * 
 * Usage:
 * npx tsx scripts/test-qcto-helper-simple.ts
 */

import { canReadForQCTO, assertCanReadForQCTO, canReadInstitutionForQCTO } from "@/lib/api/qctoAccess";
import type { ApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";

// Test contexts
const createPlatformAdminCtx = (): ApiContext => ({
  userId: "platform-admin-test",
  role: "PLATFORM_ADMIN",
  institutionId: null,
});

const createQCTOUserCtx = (): ApiContext => ({
  userId: "qcto-user-test",
  role: "QCTO_USER",
  institutionId: null,
});

const createInstitutionAdminCtx = (): ApiContext => ({
  userId: "inst-admin-test",
  role: "INSTITUTION_ADMIN",
  institutionId: "test-institution-id",
});

async function main() {
  console.log("🧪 Testing QCTO Access Helper\n");
  console.log("=" .repeat(60));

  // Test 1: PLATFORM_ADMIN always has access
  console.log("\n📋 Test 1: PLATFORM_ADMIN always has access");
  try {
    const ctx = createPlatformAdminCtx();
    const result = await canReadForQCTO(ctx, "READINESS", "any-id-123");
    if (result === true) {
      console.log("   ✅ PLATFORM_ADMIN returned true (expected)");
    } else {
      console.log("   ❌ PLATFORM_ADMIN returned false (UNEXPECTED!)");
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: QCTO_USER with no access (deny-by-default)
  console.log("\n📋 Test 2: QCTO_USER with no access (deny-by-default)");
  try {
    const ctx = createQCTOUserCtx();
    const result = await canReadForQCTO(ctx, "READINESS", "non-existent-id-999");
    if (result === false) {
      console.log("   ✅ QCTO_USER returned false for non-existent resource (expected - deny-by-default)");
    } else {
      console.log("   ❌ QCTO_USER returned true (UNEXPECTED!)");
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: QCTO_USER with APPROVED submission (if data exists)
  console.log("\n📋 Test 3: QCTO_USER with APPROVED submission");
  try {
    // First, check if we have any APPROVED submissions with resources
    const approvedSubmission = await prisma.submission.findFirst({
      where: {
        status: "APPROVED",
        deleted_at: null,
      },
      include: {
        submissionResources: {
          take: 1,
        },
      },
    });

    if (approvedSubmission && approvedSubmission.submissionResources.length > 0) {
      const resource = approvedSubmission.submissionResources[0];
      const ctx = createQCTOUserCtx();
      const result = await canReadForQCTO(
        ctx,
        resource.resource_type as any,
        resource.resource_id_value
      );
      if (result === true) {
        console.log(`   ✅ QCTO_USER can access resource via APPROVED submission`);
        console.log(`      Resource: ${resource.resource_type}:${resource.resource_id_value}`);
      } else {
        console.log(`   ❌ QCTO_USER cannot access resource (UNEXPECTED!)`);
      }
    } else {
      console.log("   ⚠️  No APPROVED submissions found in database (skipping)");
      console.log("      To test this, create a Submission with status='APPROVED' and a SubmissionResource");
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: QCTO_USER with APPROVED QCTORequest (if data exists)
  console.log("\n📋 Test 4: QCTO_USER with APPROVED QCTORequest");
  try {
    // Check if we have any APPROVED QCTORequests with resources
    const approvedRequest = await prisma.qCTORequest.findFirst({
      where: {
        status: "APPROVED",
        deleted_at: null,
      },
      include: {
        requestResources: {
          take: 1,
        },
      },
    });

    if (approvedRequest && approvedRequest.requestResources.length > 0) {
      const resource = approvedRequest.requestResources[0];
      const ctx = createQCTOUserCtx();
      const result = await canReadForQCTO(
        ctx,
        resource.resource_type as any,
        resource.resource_id_value
      );
      if (result === true) {
        console.log(`   ✅ QCTO_USER can access resource via APPROVED QCTORequest`);
        console.log(`      Resource: ${resource.resource_type}:${resource.resource_id_value}`);
      } else {
        console.log(`   ❌ QCTO_USER cannot access resource (UNEXPECTED!)`);
      }
    } else {
      console.log("   ⚠️  No APPROVED QCTORequests found in database (skipping)");
      console.log("      To test this, create a QCTORequest with status='APPROVED' and a QCTORequestResource");
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log(`      Note: After migration, verify the Prisma model name (might be qCTORequest or qctoRequest)`);
  }

  // Test 5: Other roles denied
  console.log("\n📋 Test 5: Other roles denied");
  try {
    const ctx = createInstitutionAdminCtx();
    const result = await canReadForQCTO(ctx, "READINESS", "any-id-123");
    if (result === false) {
      console.log("   ✅ INSTITUTION_ADMIN returns false (expected - no QCTO access)");
    } else {
      console.log("   ❌ INSTITUTION_ADMIN returned true (UNEXPECTED!)");
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 6: canReadInstitutionForQCTO
  console.log("\n📋 Test 6: canReadInstitutionForQCTO");
  try {
    // Check if we have any institutions with APPROVED submissions
    const institutionWithSubmission = await prisma.submission.findFirst({
      where: {
        status: "APPROVED",
        deleted_at: null,
      },
      select: {
        institution_id: true,
      },
    });

    if (institutionWithSubmission) {
      const ctx = createQCTOUserCtx();
      const result = await canReadInstitutionForQCTO(ctx, institutionWithSubmission.institution_id);
      if (result === true) {
        console.log(`   ✅ QCTO_USER can access institution with APPROVED submission`);
        console.log(`      Institution: ${institutionWithSubmission.institution_id}`);
      } else {
        console.log(`   ❌ QCTO_USER cannot access institution (UNEXPECTED!)`);
      }
    } else {
      console.log("   ⚠️  No institutions with APPROVED submissions found (skipping)");
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 7: assertCanReadForQCTO error handling
  console.log("\n📋 Test 7: assertCanReadForQCTO error handling");
  try {
    const ctx = createQCTOUserCtx();
    await assertCanReadForQCTO(ctx, "READINESS", "non-existent-id-999");
    console.log("   ❌ Should have thrown error (UNEXPECTED!)");
  } catch (error: any) {
    if (error.code === "FORBIDDEN") {
      console.log("   ✅ assertCanReadForQCTO throws AppError with FORBIDDEN code (expected)");
    } else {
      console.log(`   ❌ Unexpected error: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Basic tests complete!");
  console.log("\n📝 Next steps:");
  console.log("   1. Apply Prisma migration if not done:");
  console.log("      npx prisma migrate dev --name add_submission_qcto_request_models");
  console.log("   2. Create test data (see docs/07-Testing/QCTO-Access-Testing.md)");
  console.log("   3. Re-run this script to test with actual data\n");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
