// Seed script for development accounts
// When DEMO_MODE=true: runs ONLY demo seed (prisma/seed.demo.ts). Production seed is skipped.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

const prisma = new PrismaClient();

async function main() {
  if (process.env.DEMO_MODE === "true") {
    const { runDemoSeed } = await import("./seed.demo");
    await runDemoSeed();
    return;
  }

  console.log("Seeding database...");

  // Create test institution
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
  }

  console.log("Created institution:", institution.institution_id);

  // Create test learner for student
  let learner = await prisma.learner.findUnique({
    where: { national_id: "9001015009087" },
  });

  if (!learner) {
    learner = await prisma.learner.create({
      data: {
        institution_id: institution.institution_id,
        national_id: "9001015009087",
        first_name: "Test",
        last_name: "Student",
        birth_date: new Date("1990-01-01"),
        gender_code: "M",
        nationality_code: "ZA",
        popia_consent: true,
        consent_date: new Date(),
      },
    });
  }

  console.log("Created learner:", learner.learner_id);

  // Create sample qualifications
  const qualifications = [
    {
      name: "Plumber",
      code: "PLM-001",
    },
    {
      name: "Project Manager",
      code: "PM-001",
    },
    {
      name: "Electrician",
      code: "ELC-001",
    },
  ];

  const createdQualifications = [];
  for (const qualData of qualifications) {
    let qualification = await prisma.qualification.findFirst({
      where: { code: qualData.code },
    });

    if (!qualification) {
      qualification = await prisma.qualification.create({
        data: qualData,
      });
      console.log(`Created qualification: ${qualification.name} (${qualification.qualification_id})`);
    } else {
      console.log(`Qualification already exists: ${qualification.name} (${qualification.qualification_id})`);
    }
    createdQualifications.push(qualification);
  }

  // Create PLATFORM_ADMIN (primary dev login)
  const adminPassword = await hashPassword("Admin@12345");
  const admin = await prisma.user.upsert({
    where: { email: "admin@yiba.local" },
    update: {
      password_hash: adminPassword,
      first_name: "Platform",
      last_name: "Admin",
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
    },
    create: {
      email: "admin@yiba.local",
      first_name: "Platform",
      last_name: "Admin",
      role: "PLATFORM_ADMIN",
      password_hash: adminPassword,
      status: "ACTIVE",
    },
  });
  console.log("Created/Updated PLATFORM_ADMIN:", admin.email);

  // Create QCTO_USER
  const qctoPassword = await hashPassword("Qcto@123!");
  const qcto = await prisma.user.upsert({
    where: { email: "qcto@yibaverified.co.za" },
    update: {},
    create: {
      email: "qcto@yibaverified.co.za",
      first_name: "QCTO",
      last_name: "Reviewer",
      role: "QCTO_USER",
      password_hash: qctoPassword,
      status: "ACTIVE",
    },
  });
  console.log("Created QCTO_USER:", qcto.email);

  // Create INSTITUTION_ADMIN
  const instAdminPassword = await hashPassword("Inst@123!");
  const instAdmin = await prisma.user.upsert({
    where: { email: "instadmin@yibaverified.co.za" },
    update: {},
    create: {
      email: "instadmin@yibaverified.co.za",
      first_name: "Institution",
      last_name: "Admin",
      role: "INSTITUTION_ADMIN",
      institution_id: institution.institution_id,
      password_hash: instAdminPassword,
      status: "ACTIVE",
    },
  });
  console.log("Created INSTITUTION_ADMIN:", instAdmin.email);

  // Create INSTITUTION_STAFF
  const staffPassword = await hashPassword("Staff@123!");
  const staff = await prisma.user.upsert({
    where: { email: "staff@yibaverified.co.za" },
    update: {},
    create: {
      email: "staff@yibaverified.co.za",
      first_name: "Institution",
      last_name: "Staff",
      role: "INSTITUTION_STAFF",
      institution_id: institution.institution_id,
      password_hash: staffPassword,
      status: "ACTIVE",
    },
  });
  console.log("Created INSTITUTION_STAFF:", staff.email);

  // Create STUDENT (linked to learner)
  const studentPassword = await hashPassword("Student@123!");
  const student = await prisma.user.upsert({
    where: { email: "student@yibaverified.co.za" },
    update: {},
    create: {
      email: "student@yibaverified.co.za",
      first_name: "Test",
      last_name: "Student",
      role: "STUDENT",
      password_hash: studentPassword,
      status: "ACTIVE",
    },
  });

  // Link student to learner
  await prisma.learner.update({
    where: { learner_id: learner.learner_id },
    data: { user_id: student.user_id },
  });

  console.log("Created STUDENT:", student.email);
  console.log("Linked student to learner:", learner.learner_id);

  console.log("\n✅ Seeding completed!");
  console.log("\n📋 Seeded Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑 PRIMARY DEV LOGIN:");
  console.log("   Email:    admin@yiba.local");
  console.log("   Password: Admin@12345");
  console.log("   Role:     PLATFORM_ADMIN");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📋 Additional Test Accounts:");
  console.log("PLATFORM_ADMIN: admin@yibaverified.co.za / Admin@123!");
  console.log("QCTO_USER: qcto@yibaverified.co.za / Qcto@123!");
  console.log("INSTITUTION_ADMIN: instadmin@yibaverified.co.za / Inst@123!");
  console.log("INSTITUTION_STAFF: staff@yibaverified.co.za / Staff@123!");
  console.log("STUDENT: student@yibaverified.co.za / Student@123!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
