/**
 * Create new test users with working passwords
 * Run with: npx tsx scripts/create-test-users.ts
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔐 Creating new test users...\n");

  // Simple password for all test users
  const testPassword = "Test123!";
  const hashedPassword = await hashPassword(testPassword);

  // Get or create QCTO Org
  let qctoOrg = await prisma.qCTOOrg.findFirst();
  if (!qctoOrg) {
    qctoOrg = await prisma.qCTOOrg.create({
      data: { name: "QCTO" },
    });
    console.log("✅ Created QCTO Organization");
  }

  // Get or create a test institution
  let institution = await prisma.institution.findFirst({
    where: { registration_number: "TEST-INST-001" },
  });
  if (!institution) {
    institution = await prisma.institution.create({
      data: {
        legal_name: "Test Institution",
        trading_name: "Test Institution",
        institution_type: "PRIVATE_SDP",
        registration_number: "TEST-INST-001",
        physical_address: "123 Test Street, Test City",
        province: "Gauteng",
        delivery_modes: ["FACE_TO_FACE", "BLENDED"],
        status: "APPROVED",
        contact_person_name: "Test Contact",
        contact_email: "contact@testinstitution.co.za",
        contact_number: "+27123456789",
      },
    });
    console.log("✅ Created test institution");
  }

  // Users to create
  const users = [
    {
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      role: "PLATFORM_ADMIN" as const,
      institutionId: null,
      qctoId: null,
      defaultProvince: null,
      assignedProvinces: [] as string[],
    },
    {
      email: "qcto@test.com",
      firstName: "QCTO",
      lastName: "User",
      role: "QCTO_USER" as const,
      institutionId: null,
      qctoId: qctoOrg.id,
      defaultProvince: "Gauteng",
      assignedProvinces: ["Gauteng"],
    },
    {
      email: "qcto-super@test.com",
      firstName: "QCTO",
      lastName: "Super Admin",
      role: "QCTO_SUPER_ADMIN" as const,
      institutionId: null,
      qctoId: qctoOrg.id,
      defaultProvince: null,
      assignedProvinces: [] as string[],
    },
    {
      email: "instadmin@test.com",
      firstName: "Institution",
      lastName: "Admin",
      role: "INSTITUTION_ADMIN" as const,
      institutionId: institution.institution_id,
      qctoId: null,
      defaultProvince: null,
      assignedProvinces: [] as string[],
    },
    {
      email: "staff@test.com",
      firstName: "Institution",
      lastName: "Staff",
      role: "INSTITUTION_STAFF" as const,
      institutionId: institution.institution_id,
      qctoId: null,
      defaultProvince: null,
      assignedProvinces: [] as string[],
    },
    {
      email: "student@test.com",
      firstName: "Test",
      lastName: "Student",
      role: "STUDENT" as const,
      institutionId: institution.institution_id,
      qctoId: null,
      defaultProvince: null,
      assignedProvinces: [] as string[],
    },
  ];

  console.log("\n📋 Creating users:\n");

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password_hash: hashedPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        institution_id: userData.institutionId,
        qcto_id: userData.qctoId,
        status: "ACTIVE",
        onboarding_completed: true,
        onboarding_completed_at: new Date(),
        default_province: userData.defaultProvince,
        assigned_provinces: userData.assignedProvinces,
      },
      create: {
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        institution_id: userData.institutionId,
        qcto_id: userData.qctoId,
        password_hash: hashedPassword,
        status: "ACTIVE",
        onboarding_completed: true,
        onboarding_completed_at: new Date(),
        default_province: userData.defaultProvince,
        assigned_provinces: userData.assignedProvinces,
      },
    });

    console.log(`✅ ${userData.role.padEnd(20)} ${userData.email.padEnd(25)} Password: ${testPassword}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ All users created successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📋 LOGIN CREDENTIALS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔑 All users use the same password: Test123!\n");
  users.forEach((u) => {
    console.log(`   ${u.email.padEnd(25)} (${u.role})`);
  });
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Error creating users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
