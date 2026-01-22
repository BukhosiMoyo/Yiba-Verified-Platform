// Seed script for development accounts
// When DEMO_MODE=true: runs ONLY demo seed (prisma/seed.demo.ts). Production seed is skipped.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const SALT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function between(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const prisma = new PrismaClient();

async function main() {
  if (process.env.DEMO_MODE === "true") {
    const { runDemoSeed } = await import("./seed.demo");
    await runDemoSeed();
    return;
  }

  if (process.env.PRODUCTION_MODE === "true") {
    const { main: productionSeed } = await import("./seed.production");
    await productionSeed();
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

  // --- Student accounts: each needs a Learner + User (STUDENT) linked by user_id ---
  const STUDENT_ACCOUNTS = [
    { nationalId: "9001015009087", firstName: "Test", lastName: "Student", birthDate: "1990-01-01", gender: "M", email: "student@yibaverified.co.za" },
    { nationalId: "9203155011082", firstName: "Lerato", lastName: "Dlamini", birthDate: "1992-03-15", gender: "F", email: "lerato.student@yibaverified.co.za" },
    { nationalId: "9506205007085", firstName: "Sipho", lastName: "Khumalo", birthDate: "1995-06-20", gender: "M", email: "sipho.student@yibaverified.co.za" },
    { nationalId: "9808125013081", firstName: "Thandi", lastName: "Nkosi", birthDate: "1998-08-12", gender: "F", email: "thandi.student@yibaverified.co.za" },
    { nationalId: "0012255015083", firstName: "Bongani", lastName: "Sithole", birthDate: "2000-12-25", gender: "M", email: "bongani.student@yibaverified.co.za" },
  ];

  const studentPassword = await hashPassword("Student@123!");
  const createdStudents: { email: string }[] = [];

  for (const acc of STUDENT_ACCOUNTS) {
    let learner = await prisma.learner.findUnique({ where: { national_id: acc.nationalId } });
    if (!learner) {
      // Generate public profile ID for test students (first one enabled for testing)
      const publicProfileEnabled = acc.email === "student@yibaverified.co.za";
      const publicProfileId = publicProfileEnabled ? randomBytes(16).toString("hex") : null;

      learner = await prisma.learner.create({
        data: {
          institution_id: institution.institution_id,
          national_id: acc.nationalId,
          first_name: acc.firstName,
          last_name: acc.lastName,
          birth_date: new Date(acc.birthDate),
          gender_code: acc.gender,
          nationality_code: "ZA",
          disability_status: "NO", // Required field - default to "NO"
          address: `${between(1, 999)} Main Street, Johannesburg, 2000`, // Sample address
          province: "Gauteng",
          ethnicity: "BLACK", // Sample ethnicity
          next_of_kin_name: `${acc.firstName === "Test" ? "John" : acc.firstName} ${acc.lastName}`, // Sample next of kin
          next_of_kin_relationship: "PARENT",
          next_of_kin_phone: "+27821234567",
          next_of_kin_address: `${between(1, 999)} Main Street, Johannesburg, 2000`,
          popia_consent: true,
          consent_date: new Date(),
          // Public profile settings
          public_profile_id: publicProfileId,
          public_profile_enabled: publicProfileEnabled,
        },
      });
      console.log("Created learner:", learner.learner_id, acc.firstName, acc.lastName);
    } else {
      // Update existing learner if missing required fields
      const updateData: any = {};
      if (!learner.disability_status) updateData.disability_status = "NO";
      if (!learner.address) updateData.address = `${between(1, 999)} Main Street, Johannesburg, 2000`;
      if (!learner.province) updateData.province = "Gauteng";
      if (!learner.ethnicity) updateData.ethnicity = "BLACK";
      if (!learner.next_of_kin_name) {
        updateData.next_of_kin_name = `${acc.firstName === "Test" ? "John" : acc.firstName} ${acc.lastName}`;
        updateData.next_of_kin_relationship = "PARENT";
        updateData.next_of_kin_phone = "+27821234567";
        updateData.next_of_kin_address = `${between(1, 999)} Main Street, Johannesburg, 2000`;
      }
      
      if (Object.keys(updateData).length > 0) {
        learner = await prisma.learner.update({
          where: { learner_id: learner.learner_id },
          data: updateData,
        });
        console.log("Updated learner with new fields:", learner.learner_id, acc.firstName, acc.lastName);
      }
    }

    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: { 
        password_hash: studentPassword, 
        status: "ACTIVE", 
        first_name: acc.firstName, 
        last_name: acc.lastName, 
        role: "STUDENT",
        onboarding_completed: true, // Mark as completed since we're creating the learner record directly
        onboarding_completed_at: new Date(),
        default_province: null, // Students don't need provincial assignments
        assigned_provinces: [],
      },
      create: {
        email: acc.email,
        first_name: acc.firstName,
        last_name: acc.lastName,
        role: "STUDENT",
        password_hash: studentPassword,
        status: "ACTIVE",
        onboarding_completed: true, // Mark as completed since we're creating the learner record directly
        onboarding_completed_at: new Date(),
        default_province: null, // Students don't need provincial assignments
        assigned_provinces: [],
      },
    });

    await prisma.learner.update({
      where: { learner_id: learner.learner_id },
      data: { user_id: user.user_id },
    });
    createdStudents.push({ email: acc.email });
  }

  console.log("Created/linked students:", createdStudents.map((s) => s.email).join(", "));

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
      default_province: null,
      assigned_provinces: [],
    },
    create: {
      email: "admin@yiba.local",
      first_name: "Platform",
      last_name: "Admin",
      role: "PLATFORM_ADMIN",
      password_hash: adminPassword,
      status: "ACTIVE",
      default_province: null,
      assigned_provinces: [],
    },
  });
  console.log("Created/Updated PLATFORM_ADMIN:", admin.email);

  // Ensure QCTOOrg exists
  let qctoOrg = await prisma.qCTOOrg.findFirst();
  if (!qctoOrg) {
    qctoOrg = await prisma.qCTOOrg.create({
      data: { name: "QCTO" },
    });
    console.log("Created QCTOOrg:", qctoOrg.id);
  }

  // Create QCTO Super Admin (for QCTO Team management)
  const qctoSuperAdminPassword = await hashPassword("QctoAdmin@123!");
  const qctoSuperAdmin = await prisma.user.upsert({
    where: { email: "qcto-superadmin@yibaverified.co.za" },
    update: { 
      password_hash: qctoSuperAdminPassword, 
      role: "QCTO_SUPER_ADMIN", 
      qcto_id: qctoOrg.id, 
      status: "ACTIVE",
      default_province: null, // QCTO_SUPER_ADMIN can be national (no province)
      assigned_provinces: [],
    },
    create: {
      email: "qcto-superadmin@yibaverified.co.za",
      first_name: "QCTO",
      last_name: "Super Admin",
      role: "QCTO_SUPER_ADMIN",
      qcto_id: qctoOrg.id,
      password_hash: qctoSuperAdminPassword,
      status: "ACTIVE",
      default_province: null, // QCTO_SUPER_ADMIN can be national (no province)
      assigned_provinces: [],
    },
  });
  console.log("Created QCTO Super Admin:", qctoSuperAdmin.email);

  // Create QCTO_USER
  const qctoPassword = await hashPassword("Qcto@123!");
  const qctoDefaultProvince = "Gauteng"; // Example province
  const qcto = await prisma.user.upsert({
    where: { email: "qcto@yibaverified.co.za" },
    update: {
      default_province: qctoDefaultProvince,
      assigned_provinces: [qctoDefaultProvince],
    },
    create: {
      email: "qcto@yibaverified.co.za",
      first_name: "QCTO",
      last_name: "Reviewer",
      role: "QCTO_USER",
      qcto_id: qctoOrg.id,
      password_hash: qctoPassword,
      status: "ACTIVE",
      default_province: qctoDefaultProvince,
      assigned_provinces: [qctoDefaultProvince],
    },
  });
  console.log("Created QCTO_USER:", qcto.email);

  // Create INSTITUTION_ADMIN
  const instAdminPassword = await hashPassword("Inst@123!");
  const instAdmin = await prisma.user.upsert({
    where: { email: "instadmin@yibaverified.co.za" },
    update: {
      default_province: null,
      assigned_provinces: [],
    },
    create: {
      email: "instadmin@yibaverified.co.za",
      first_name: "Institution",
      last_name: "Admin",
      role: "INSTITUTION_ADMIN",
      institution_id: institution.institution_id,
      password_hash: instAdminPassword,
      status: "ACTIVE",
      default_province: null, // Institution users don't need provincial assignments
      assigned_provinces: [],
    },
  });
  console.log("Created INSTITUTION_ADMIN:", instAdmin.email);

  // Create INSTITUTION_STAFF
  const staffPassword = await hashPassword("Staff@123!");
  const staff = await prisma.user.upsert({
    where: { email: "staff@yibaverified.co.za" },
    update: {
      default_province: null,
      assigned_provinces: [],
    },
    create: {
      email: "staff@yibaverified.co.za",
      first_name: "Institution",
      last_name: "Staff",
      role: "INSTITUTION_STAFF",
      institution_id: institution.institution_id,
      password_hash: staffPassword,
      status: "ACTIVE",
      default_province: null, // Institution users don't need provincial assignments
      assigned_provinces: [],
    },
  });
  console.log("Created INSTITUTION_STAFF:", staff.email);

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
  console.log("QCTO Super Admin: qcto-superadmin@yibaverified.co.za / QctoAdmin@123!");
  console.log("QCTO_USER: qcto@yibaverified.co.za / Qcto@123!");
  console.log("INSTITUTION_ADMIN: instadmin@yibaverified.co.za / Inst@123!");
  console.log("INSTITUTION_STAFF: staff@yibaverified.co.za / Staff@123!");
  console.log("\n📋 STUDENT (all use password: Student@123!):");
  for (const acc of STUDENT_ACCOUNTS) {
    console.log(`   ${acc.email} (${acc.firstName} ${acc.lastName})`);
  }
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
