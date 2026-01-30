/**
 * Create a test evidence flag for a QCTO user in Gauteng
 * Run with: npx tsx scripts/create-test-evidence-flag.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🚩 Creating test evidence flag for QCTO user in Gauteng...\n");

  // Find a QCTO_USER in Gauteng
  const qctoUser = await prisma.user.findFirst({
    where: {
      role: "QCTO_USER",
      assigned_provinces: {
        has: "Gauteng",
      },
      deleted_at: null,
    },
    select: {
      user_id: true,
      email: true,
      first_name: true,
      last_name: true,
      assigned_provinces: true,
    },
  });

  if (!qctoUser) {
    console.error("❌ No QCTO_USER found with Gauteng in assigned_provinces");
    console.log("\n💡 Tip: Create a QCTO user with Gauteng assigned first");
    process.exit(1);
  }

  console.log(`✅ Found QCTO user: ${qctoUser.first_name} ${qctoUser.last_name} (${qctoUser.email})`);
  console.log(`   Assigned provinces: ${qctoUser.assigned_provinces.join(", ")}\n`);

  // Find a document from a Gauteng institution that's accessible via submission or request
  // First, try to find a document from an approved submission
  let document = null;

  // Try to find a document linked to an approved submission
  const approvedSubmission = await prisma.submission.findFirst({
    where: {
      status: "APPROVED",
      deleted_at: null,
      institution: {
        province: "Gauteng",
      },
    },
    include: {
      submissionResources: {
        where: {
          resource_type: "DOCUMENT",
        },
        take: 1,
      },
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
          province: true,
        },
      },
    },
  });

  if (approvedSubmission && approvedSubmission.submissionResources.length > 0) {
    const resource = approvedSubmission.submissionResources[0];
    document = await prisma.document.findUnique({
      where: { document_id: resource.resource_id_value },
      include: {
        institution: {
          select: {
            legal_name: true,
            trading_name: true,
            province: true,
          },
        },
      },
    });

    if (document) {
      console.log(`✅ Found document from approved submission:`);
      console.log(`   Document: ${document.file_name}`);
      console.log(`   Type: ${document.document_type}`);
      console.log(`   Institution: ${document.institution?.trading_name || document.institution?.legal_name || "Unknown"}`);
      console.log(`   Province: ${document.institution?.province || "Unknown"}\n`);
    }
  }

  // If no document from submission, try to find any document from Gauteng institution
  if (!document) {
    console.log("⚠️  No document found from approved submission, searching for any Gauteng document...\n");
    
    document = await prisma.document.findFirst({
      where: {
        related_entity: "INSTITUTION",
        status: { in: ["UPLOADED", "FLAGGED"] },
      },
      include: {
        institution: {
          where: {
            province: "Gauteng",
          },
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
            province: true,
          },
        },
      },
    });

    if (document && document.institution) {
      console.log(`✅ Found document from Gauteng institution:`);
      console.log(`   Document: ${document.file_name}`);
      console.log(`   Type: ${document.document_type}`);
      console.log(`   Institution: ${document.institution.trading_name || document.institution.legal_name}`);
      console.log(`   Province: ${document.institution.province}\n`);
      
      // Note: This document might not be accessible to QCTO_USER if not in approved submission/request
      // But we'll create the flag anyway for testing purposes
      console.log("⚠️  Note: This document may not be visible to QCTO_USER if not in approved submission/request");
      console.log("   The flag will be created, but may not appear in the evidence flags list\n");
    }
  }

  // If still no document, try readiness documents
  if (!document) {
    const readiness = await prisma.readiness.findFirst({
      where: {
        institution: {
          province: "Gauteng",
        },
        deleted_at: null,
      },
      include: {
        documents: {
          take: 1,
        },
        institution: {
          select: {
            legal_name: true,
            trading_name: true,
            province: true,
          },
        },
      },
    });

    if (readiness && readiness.documents.length > 0) {
      document = readiness.documents[0];
      console.log(`✅ Found document from readiness record:`);
      console.log(`   Document: ${document.file_name}`);
      console.log(`   Type: ${document.document_type}`);
      console.log(`   Institution: ${readiness.institution.trading_name || readiness.institution.legal_name}`);
      console.log(`   Province: ${readiness.institution.province}\n`);
    }
  }

  if (!document) {
    console.error("❌ No documents found from Gauteng institutions");
    console.log("\n💡 Tip: Create a document first, or ensure there are institutions in Gauteng with documents");
    process.exit(1);
  }

  // Check if document already has an active flag
  const existingFlag = await prisma.evidenceFlag.findFirst({
    where: {
      document_id: document.document_id,
      status: "ACTIVE",
    },
  });

  if (existingFlag) {
    console.log(`⚠️  Document already has an active flag (ID: ${existingFlag.flag_id})`);
    console.log(`   Reason: ${existingFlag.reason}`);
    console.log(`   Flagged by: ${existingFlag.flagged_by}`);
    console.log("\n✅ Evidence flag already exists! Check the Evidence Flags page.\n");
    process.exit(0);
  }

  // Create the evidence flag
  const flag = await prisma.evidenceFlag.create({
    data: {
      document_id: document.document_id,
      flagged_by: qctoUser.user_id,
      reason: "Test flag - Document requires verification for compliance with Form 5 requirements",
      status: "ACTIVE",
    },
  });

  // Update document status to FLAGGED if it's currently UPLOADED
  if (document.status === "UPLOADED") {
    await prisma.document.update({
      where: { document_id: document.document_id },
      data: { status: "FLAGGED" },
    });
    console.log("✅ Updated document status from UPLOADED to FLAGGED");
  }

  console.log("\n✅ Evidence flag created successfully!");
  console.log(`   Flag ID: ${flag.flag_id}`);
  console.log(`   Document: ${document.file_name}`);
  console.log(`   Reason: ${flag.reason}`);
  console.log(`   Status: ${flag.status}`);
  console.log(`   Flagged by: ${qctoUser.first_name} ${qctoUser.last_name} (${qctoUser.email})`);
  console.log(`   Created at: ${flag.created_at.toISOString()}`);
  console.log("\n💡 You can now view this flag at: /qcto/evidence-flags\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
