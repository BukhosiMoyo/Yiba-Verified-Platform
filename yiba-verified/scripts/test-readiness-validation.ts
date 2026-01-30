/**
 * Test Script: Readiness Submission Validation
 * 
 * Validates that submission validation works correctly according to Form 5 requirements.
 * 
 * Run with: npx tsx scripts/test-readiness-validation.ts
 */

import { PrismaClient } from "@prisma/client";
import { validateReadinessForSubmission } from "../src/lib/readinessCompletion";

const prisma = new PrismaClient();

async function testSubmissionValidation() {
  console.log("🧪 Testing Readiness Submission Validation...\n");

  // Test 1: Complete readiness record should pass validation
  console.log("Test 1: Complete readiness record");
  const completeReadiness = await prisma.readiness.findFirst({
    where: {
      deleted_at: null,
      credits: { not: null },
      self_assessment_completed: { not: null },
      registration_type: { not: null },
    },
    include: {
      facilitators: { select: { facilitator_id: true } },
      documents: { select: { document_id: true, document_type: true } },
    },
  });

  if (completeReadiness) {
    const validation = validateReadinessForSubmission(completeReadiness);
    if (validation.can_submit) {
      console.log("✅ PASSED: Complete readiness record passes validation");
      console.log(`   Errors: ${validation.errors.length}`);
      console.log(`   Warnings: ${validation.warnings.length}\n`);
    } else {
      console.error("❌ FAILED: Complete readiness record should pass validation");
      console.error("   Errors:", validation.errors);
      process.exit(1);
    }
  } else {
    console.log("⚠️  SKIPPED: No complete readiness record found\n");
  }

  // Test 2: Incomplete readiness record should fail validation
  console.log("Test 2: Incomplete readiness record (missing credits)");
  const incompleteReadiness = await prisma.readiness.findFirst({
    where: {
      deleted_at: null,
      credits: null,
    },
    include: {
      facilitators: { select: { facilitator_id: true } },
      documents: { select: { document_id: true, document_type: true } },
    },
  });

  if (incompleteReadiness) {
    const validation = validateReadinessForSubmission(incompleteReadiness);
    if (!validation.can_submit && validation.errors.length > 0) {
      console.log("✅ PASSED: Incomplete readiness record fails validation");
      console.log(`   Errors: ${validation.errors.length}`);
      console.log(`   First error: ${validation.errors[0]}\n`);
    } else {
      console.error("❌ FAILED: Incomplete readiness record should fail validation");
      process.exit(1);
    }
  } else {
    console.log("⚠️  SKIPPED: No incomplete readiness record found\n");
  }

  // Test 3: Learning material coverage < 50% should fail
  console.log("Test 3: Learning material coverage < 50%");
  const lowCoverageReadiness = await prisma.readiness.findFirst({
    where: {
      deleted_at: null,
      learning_material_coverage_percentage: { lt: 50 },
    },
    include: {
      facilitators: { select: { facilitator_id: true } },
      documents: { select: { document_id: true, document_type: true } },
    },
  });

  if (lowCoverageReadiness) {
    const validation = validateReadinessForSubmission(lowCoverageReadiness);
    const hasCoverageError = validation.errors.some((e) =>
      e.includes("50%") || e.includes("coverage")
    );
    if (hasCoverageError) {
      console.log("✅ PASSED: Low coverage record fails validation");
      console.log(`   Coverage: ${lowCoverageReadiness.learning_material_coverage_percentage}%`);
      console.log(`   Error: ${validation.errors.find((e) => e.includes("50%"))}\n`);
    } else {
      console.error("❌ FAILED: Low coverage record should fail validation");
      process.exit(1);
    }
  } else {
    console.log("⚠️  SKIPPED: No low coverage readiness record found\n");
  }

  // Test 4: Missing self-assessment should fail
  console.log("Test 4: Missing self-assessment");
  const noSelfAssessment = await prisma.readiness.findFirst({
    where: {
      deleted_at: null,
      self_assessment_completed: null,
    },
    include: {
      facilitators: { select: { facilitator_id: true } },
      documents: { select: { document_id: true, document_type: true } },
    },
  });

  if (noSelfAssessment) {
    const validation = validateReadinessForSubmission(noSelfAssessment);
    const hasSelfAssessmentError = validation.errors.some((e) =>
      e.toLowerCase().includes("self-assessment")
    );
    if (hasSelfAssessmentError) {
      console.log("✅ PASSED: Missing self-assessment fails validation");
      console.log(`   Error: ${validation.errors.find((e) => e.toLowerCase().includes("self-assessment"))}\n`);
    } else {
      console.error("❌ FAILED: Missing self-assessment should fail validation");
      process.exit(1);
    }
  } else {
    console.log("⚠️  SKIPPED: No readiness record without self-assessment found\n");
  }

  console.log("✅ All validation tests passed!\n");
}

testSubmissionValidation()
  .catch((error) => {
    console.error("❌ Test failed with error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
