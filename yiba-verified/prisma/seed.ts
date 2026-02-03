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

  // --- Public directory: ensure public profile + sample posts/reviews/leads for test institution ---
  const slugify = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "institution";
  let profile = await prisma.institutionPublicProfile.findUnique({
    where: { institution_id: institution.institution_id },
  });
  if (!profile) {
    let slug = slugify(institution.trading_name || institution.legal_name);
    let n = 0;
    while (await prisma.institutionPublicProfile.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${slugify(institution.trading_name || institution.legal_name)}-${n}`;
    }
    profile = await prisma.institutionPublicProfile.create({
      data: {
        institution_id: institution.institution_id,
        slug,
        is_public: true,
        tagline: "Quality skills development and accredited programmes.",
        about:
          "Test Institution offers accredited qualifications in plumbing, electrical engineering, project management and more. We support learners from enrolment to certification.",
        contact_visibility: "PUBLIC",
        apply_mode: "BOTH",
        apply_url: "https://example.com/apply",
        contact_email: institution.contact_email ?? undefined,
        contact_phone: institution.contact_number ?? undefined,
      },
    });
    console.log("Created public profile for test institution:", profile.slug);
  }
  // Sample posts
  const postCount = await prisma.institutionPost.count({
    where: { institution_id: institution.institution_id },
  });
  if (postCount === 0) {
    await prisma.institutionPost.createMany({
      data: [
        {
          institution_id: institution.institution_id,
          type: "ACHIEVEMENT",
          title: "New plumbing workshop opened",
          body: "We have opened a new fully equipped plumbing workshop for our NQF 4 learners.",
          is_verified: true,
        },
        {
          institution_id: institution.institution_id,
          type: "UPDATE",
          title: "Enrolment open for 2025",
          body: "Enrolment for our accredited programmes is now open. Contact us for more information.",
          is_verified: false,
        },
      ],
    });
    console.log("Created sample posts for test institution");
  }
  // Sample reviews
  const reviewCount = await prisma.institutionReview.count({
    where: { institution_id: institution.institution_id },
  });
  if (reviewCount === 0) {
    await prisma.institutionReview.createMany({
      data: [
        {
          institution_id: institution.institution_id,
          rating: 5,
          comment: "Excellent training and support. I completed my plumbing qualification here.",
          reviewer_name: "Sipho M.",
          status: "PUBLISHED",
        },
        {
          institution_id: institution.institution_id,
          rating: 4,
          comment: "Good facilities and knowledgeable facilitators.",
          reviewer_name: "Lerato K.",
          status: "PUBLISHED",
        },
        {
          institution_id: institution.institution_id,
          rating: 5,
          comment: "Highly recommend for anyone looking to get accredited.",
          reviewer_name: "Thabo N.",
          status: "PUBLISHED",
        },
      ],
    });
    console.log("Created sample reviews for test institution");
  }
  // Sample leads
  const leadCount = await prisma.institutionLead.count({
    where: { institution_id: institution.institution_id },
  });
  if (leadCount === 0) {
    await prisma.institutionLead.createMany({
      data: [
        {
          institution_id: institution.institution_id,
          source: "PUBLIC",
          full_name: "Prospective Learner One",
          email: "prospective1@example.com",
          phone: "+27821234567",
          message: "I am interested in the plumbing programme.",
          status: "NEW",
        },
        {
          institution_id: institution.institution_id,
          source: "PUBLIC",
          full_name: "Prospective Learner Two",
          email: "prospective2@example.com",
          qualification_interest: "Electrical Engineering",
          status: "CONTACTED",
        },
        {
          institution_id: institution.institution_id,
          source: "PUBLIC",
          full_name: "Prospective Learner Three",
          email: "prospective3@example.com",
          message: "When does the next intake start?",
          status: "NEW",
        },
      ],
    });
    console.log("Created sample leads for test institution");
  }

  // --- Extra institutions for public directory (20 total with public profiles) ---
  const EXTRA_INSTITUTION_NAMES = [
    { legal: "Ubuntu Skills Training (Pty) Ltd", trading: "Ubuntu Skills Academy" },
    { legal: "Sizanani Education (Pty) Ltd", trading: "Sizanani Academy" },
    { legal: "Thuto Pele Academy (Pty) Ltd", trading: "Thuto Pele" },
    { legal: "Khanyisa Learning Institute (Pty) Ltd", trading: "Khanyisa Institute" },
    { legal: "Sefako Skills Development (Pty) Ltd", trading: "Sefako College" },
    { legal: "Lephalala TVET College", trading: "Lephalala TVET" },
    { legal: "Mohloli Training Solutions (Pty) Ltd", trading: "Mohloli Training" },
    { legal: "Realeboga Skills Academy (Pty) Ltd", trading: "Realeboga Academy" },
    { legal: "Kgotso Private College (Pty) Ltd", trading: "Kgotso College" },
    { legal: "Matla Vocational Centre (Pty) Ltd", trading: "Matla Vocational" },
    { legal: "Bonani Education (Pty) Ltd", trading: "Bonani Education" },
    { legal: "Phetogo Skills (Pty) Ltd", trading: "Phetogo Skills" },
    { legal: "Tshepo Training (Pty) Ltd", trading: "Tshepo Training" },
    { legal: "Karabo Learning (Pty) Ltd", trading: "Karabo Learning" },
    { legal: "Lerato Academy (Pty) Ltd", trading: "Lerato Academy" },
    { legal: "Naledi College (Pty) Ltd", trading: "Naledi College" },
    { legal: "Refilwe Skills (Pty) Ltd", trading: "Refilwe Skills" },
    { legal: "Mpho Training Centre (Pty) Ltd", trading: "Mpho Training" },
    { legal: "Kagiso Institute (Pty) Ltd", trading: "Kagiso Institute" },
  ];
  const PROVINCES_LIST = [
    "Gauteng",
    "Western Cape",
    "KwaZulu-Natal",
    "Eastern Cape",
    "Free State",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
  ];
  for (let i = 0; i < EXTRA_INSTITUTION_NAMES.length; i++) {
    const reg = `TEST-PUB-${String(i + 1).padStart(3, "0")}`;
    let inst = await prisma.institution.findFirst({
      where: { registration_number: reg },
    });
    if (!inst) {
      inst = await prisma.institution.create({
        data: {
          legal_name: EXTRA_INSTITUTION_NAMES[i].legal,
          trading_name: EXTRA_INSTITUTION_NAMES[i].trading,
          institution_type: "PRIVATE_SDP",
          registration_number: reg,
          physical_address: `${between(1, 999)} Main Road, ${PROVINCES_LIST[i % PROVINCES_LIST.length]}`,
          province: PROVINCES_LIST[i % PROVINCES_LIST.length],
          delivery_modes: ["FACE_TO_FACE", "BLENDED"],
          status: "APPROVED",
          contact_person_name: "Contact Person",
          contact_email: `contact${i + 1}@demo.co.za`,
          contact_number: "+27821234567",
        },
      });
      console.log("Created extra institution for directory:", inst.trading_name);
    }
    let extraProfile = await prisma.institutionPublicProfile.findUnique({
      where: { institution_id: inst.institution_id },
    });
    if (!extraProfile) {
      let slug = slugify(inst.trading_name || inst.legal_name);
      let n = 0;
      while (await prisma.institutionPublicProfile.findUnique({ where: { slug } })) {
        n += 1;
        slug = `${slugify(inst.trading_name || inst.legal_name)}-${n}`;
      }
      extraProfile = await prisma.institutionPublicProfile.create({
        data: {
          institution_id: inst.institution_id,
          slug,
          is_public: true,
          tagline: "Accredited programmes and skills development.",
          about: `${inst.trading_name} provides quality accredited training and skills development.`,
          contact_visibility: "REVEAL_ON_CLICK",
          apply_mode: "INTERNAL",
          contact_email: inst.contact_email ?? undefined,
          contact_phone: inst.contact_number ?? undefined,
        },
      });
      await prisma.institutionPost.create({
        data: {
          institution_id: inst.institution_id,
          type: "UPDATE",
          title: "Welcome to our profile",
          body: "We are pleased to be listed on Yiba Verified. Contact us for more information.",
          is_verified: false,
        },
      });
      await prisma.institutionReview.create({
        data: {
          institution_id: inst.institution_id,
          rating: between(4, 5),
          comment: "Good institution.",
          reviewer_name: "Anonymous",
          status: "PUBLISHED",
        },
      });
      await prisma.institutionLead.create({
        data: {
          institution_id: inst.institution_id,
          source: "PUBLIC",
          full_name: "Demo Enquirer",
          email: "demo@example.com",
          status: "NEW",
        },
      });
      console.log("Created public profile + sample data:", extraProfile.slug);
    }
  }

  // --- QualificationRegistry: ACTIVE qualifications for institution search/apply (Form 5) ---
  const ACTIVE_QUALIFICATIONS = [
    {
      name: "National Certificate: Plumbing (NQF 4)",
      code: "PLM-NQF4",
      saqa_id: "12345",
      curriculum_code: "65749",
      nqf_level: 4,
      credits: 120,
      occupational_category: "Building and Civil Engineering",
      description: "Plumbing qualification for building and civil engineering.",
      status: "ACTIVE" as const,
    },
    {
      name: "National Certificate: Electrical Engineering (NQF 3)",
      code: "ELC-NQF3",
      saqa_id: "23456",
      curriculum_code: "66169",
      nqf_level: 3,
      credits: 130,
      occupational_category: "Electrical Engineering",
      description: "Electrical engineering qualification for installation and maintenance.",
      status: "ACTIVE" as const,
    },
    {
      name: "National Diploma: Project Management (NQF 5)",
      code: "PM-NQF5",
      saqa_id: "34567",
      curriculum_code: "50334",
      nqf_level: 5,
      credits: 240,
      occupational_category: "Business, Commerce and Management",
      description: "Project management diploma for planning and execution.",
      status: "ACTIVE" as const,
    },
    {
      name: "National Certificate: Welding (NQF 2)",
      code: "WLD-NQF2",
      saqa_id: "45678",
      curriculum_code: "65729",
      nqf_level: 2,
      credits: 120,
      occupational_category: "Manufacturing, Engineering and Technology",
      description: "Welding qualification for fabrication and construction.",
      status: "ACTIVE" as const,
    },
    {
      name: "National Certificate: Early Childhood Development (NQF 4)",
      code: "ECD-NQF4",
      saqa_id: "56789",
      curriculum_code: "23118",
      nqf_level: 4,
      credits: 120,
      occupational_category: "Education, Training and Development",
      description: "Early childhood development for practitioners and educators.",
      status: "ACTIVE" as const,
    },
    {
      name: "National Certificate: Information Technology (NQF 5)",
      code: "IT-NQF5",
      saqa_id: "67890",
      curriculum_code: "48872",
      nqf_level: 5,
      credits: 240,
      occupational_category: "Information Technology and Computer Sciences",
      description: "IT systems development and support qualification.",
      status: "ACTIVE" as const,
    },
  ];

  for (const q of ACTIVE_QUALIFICATIONS) {
    const existing = await prisma.qualificationRegistry.findFirst({
      where: { saqa_id: q.saqa_id, deleted_at: null },
    });
    if (!existing) {
      await prisma.qualificationRegistry.create({
        data: q,
      });
      console.log(`Created QualificationRegistry (ACTIVE): ${q.name}`);
    }
  }

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

  // Create PLATFORM_ADMIN (primary dev login) - Auto-verified with BLACK badge
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
      onboarding_completed: true, // Skip onboarding for dev account
      onboarding_completed_at: new Date(),
      verification_level: "BLACK", // Auto-verified platform admin
      verification_date: new Date(),
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
      onboarding_completed: true, // Skip onboarding for dev account
      onboarding_completed_at: new Date(),
      verification_level: "BLACK", // Auto-verified platform admin
      verification_date: new Date(),
    },
  });
  console.log("Created/Updated PLATFORM_ADMIN:", admin.email);

  // Create secondary PLATFORM_ADMIN - Auto-verified with BLACK badge
  const admin2Password = await hashPassword("Admin@123!");
  const admin2 = await prisma.user.upsert({
    where: { email: "admin@yibaverified.co.za" },
    update: {
      password_hash: admin2Password,
      first_name: "Platform",
      last_name: "Administrator",
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
      default_province: null,
      assigned_provinces: [],
      onboarding_completed: true,
      onboarding_completed_at: new Date(),
      verification_level: "BLACK", // Auto-verified platform admin
      verification_date: new Date(),
    },
    create: {
      email: "admin@yibaverified.co.za",
      first_name: "Platform",
      last_name: "Administrator",
      role: "PLATFORM_ADMIN",
      password_hash: admin2Password,
      status: "ACTIVE",
      default_province: null,
      assigned_provinces: [],
      onboarding_completed: true,
      onboarding_completed_at: new Date(),
      verification_level: "BLACK", // Auto-verified platform admin
      verification_date: new Date(),
    },
  });
  console.log("Created/Updated PLATFORM_ADMIN:", admin2.email);

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
      onboarding_completed: true, // Skip onboarding for seeded dev account
      onboarding_completed_at: new Date(),
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
      onboarding_completed: true, // Skip onboarding for seeded dev account
      onboarding_completed_at: new Date(),
    },
  });
  console.log("Created QCTO Super Admin:", qctoSuperAdmin.email);

  // Create QCTO_USER
  const qctoPassword = await hashPassword("Qcto@123!");
  const qctoDefaultProvince = "Gauteng"; // Example province
  const qcto = await prisma.user.upsert({
    where: { email: "qcto@yibaverified.co.za" },
    update: {
      password_hash: qctoPassword,
      default_province: qctoDefaultProvince,
      assigned_provinces: [qctoDefaultProvince],
      onboarding_completed: true, // Skip onboarding for seeded dev account
      onboarding_completed_at: new Date(),
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
      onboarding_completed: true, // Skip onboarding for seeded dev account
      onboarding_completed_at: new Date(),
    },
  });
  console.log("Created QCTO_USER:", qcto.email);

  // Create INSTITUTION_ADMIN
  const instAdminPassword = await hashPassword("Inst@123!");
  const instAdmin = await prisma.user.upsert({
    where: { email: "instadmin@yibaverified.co.za" },
    update: {
      password_hash: instAdminPassword,
      default_province: null,
      assigned_provinces: [],
      onboarding_completed: true, // Skip onboarding for seeded dev account
      onboarding_completed_at: new Date(),
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
      onboarding_completed: true, // Skip onboarding for seeded dev account
      onboarding_completed_at: new Date(),
    },
  });
  console.log("Created INSTITUTION_ADMIN:", instAdmin.email);

  // Create INSTITUTION_STAFF
  const staffPassword = await hashPassword("Staff@123!");
  const staff = await prisma.user.upsert({
    where: { email: "staff@yibaverified.co.za" },
    update: {
      password_hash: staffPassword,
      default_province: null,
      assigned_provinces: [],
      onboarding_completed: true, // Skip onboarding for seeded dev account
      onboarding_completed_at: new Date(),
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
      onboarding_completed: true, // Skip onboarding for seeded dev account
      onboarding_completed_at: new Date(),
    },
  });
  console.log("Created INSTITUTION_STAFF:", staff.email);

  // ========================================
  // CHAT & MESSAGING SEED DATA (optional – skip if tables missing)
  // ========================================
  type ChatUser = { user_id: string; email: string; first_name: string; last_name: string };
  let chatUsers: ChatUser[] = [];
  let userByEmail: Record<string, ChatUser> = {};
  try {
    console.log("\n📬 Creating chat demo data...");

    // Get users for chat
    chatUsers = await prisma.user.findMany({
      where: {
        email: {
          in: [
            "admin@yibaverified.co.za",
            "qcto@yibaverified.co.za",
            "instadmin@yibaverified.co.za",
            "staff@yibaverified.co.za",
            "student@yibaverified.co.za",
          ],
        },
      },
      select: { user_id: true, email: true, first_name: true, last_name: true },
    });

    userByEmail = Object.fromEntries(chatUsers.map((u) => [u.email, u]));

    // Only create chat data if we have users
    if (Object.keys(userByEmail).length >= 3) {
      // Check if demo conversations already exist
      const existingConv = await prisma.conversation.findFirst({
        where: { name: "Platform Support Team" },
      });

      if (!existingConv) {
        // Create a group chat
        const groupChat = await prisma.conversation.create({
          data: {
            type: "GROUP",
            name: "Platform Support Team",
            description: "Internal team chat for platform support",
            createdBy: userByEmail["admin@yibaverified.co.za"]?.user_id || chatUsers[0].user_id,
            lastMessageAt: new Date(),
            lastMessageText: "Welcome to the support team chat!",
            members: {
              create: [
                { userId: userByEmail["admin@yibaverified.co.za"]?.user_id || chatUsers[0].user_id, role: "OWNER" },
                ...(userByEmail["qcto@yibaverified.co.za"] ? [{ userId: userByEmail["qcto@yibaverified.co.za"].user_id, role: "MEMBER" as const }] : []),
                ...(userByEmail["instadmin@yibaverified.co.za"] ? [{ userId: userByEmail["instadmin@yibaverified.co.za"].user_id, role: "MEMBER" as const }] : []),
              ],
            },
          },
        });

        // Add messages to group chat
        const adminId = userByEmail["admin@yibaverified.co.za"]?.user_id || chatUsers[0].user_id;
        const qctoId = userByEmail["qcto@yibaverified.co.za"]?.user_id;
        const instAdminId = userByEmail["instadmin@yibaverified.co.za"]?.user_id;

        await prisma.message.createMany({
          data: [
            {
              conversationId: groupChat.id,
              senderId: adminId,
              content: "Welcome to the Platform Support Team chat!",
              messageType: "SYSTEM",
              status: "DELIVERED",
              createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
            },
            {
              conversationId: groupChat.id,
              senderId: adminId,
              content: "This is where we coordinate platform support activities. Feel free to ask questions or share updates.",
              status: "DELIVERED",
              isAdminMessage: true,
              createdAt: new Date(Date.now() - 86400000 * 2 + 60000),
            },
            ...(qctoId ? [{
              conversationId: groupChat.id,
              senderId: qctoId,
              content: "Thanks for setting this up! Looking forward to better coordination.",
              status: "DELIVERED" as const,
              createdAt: new Date(Date.now() - 86400000),
            }] : []),
            ...(instAdminId ? [{
              conversationId: groupChat.id,
              senderId: instAdminId,
              content: "Great initiative! This will help us communicate faster about readiness reviews.",
              status: "DELIVERED" as const,
              createdAt: new Date(Date.now() - 3600000 * 5),
            }] : []),
            {
              conversationId: groupChat.id,
              senderId: adminId,
              content: "Remember, you can also use the Report Issue button in the top bar for bug reports.",
              status: "DELIVERED",
              createdAt: new Date(Date.now() - 3600000),
            },
          ],
        });

        console.log("Created group chat:", groupChat.name);

        // Create a DM between admin and qcto
        if (qctoId) {
          const dmChat = await prisma.conversation.create({
            data: {
              type: "DIRECT",
              createdBy: adminId,
              lastMessageAt: new Date(Date.now() - 7200000),
              lastMessageText: "Let me know if you need any help with the dashboard.",
              members: {
                create: [
                  { userId: adminId, role: "OWNER" },
                  { userId: qctoId, role: "MEMBER" },
                ],
              },
            },
          });

          await prisma.message.createMany({
            data: [
              {
                conversationId: dmChat.id,
                senderId: qctoId,
                content: "Hi! I have a question about the QCTO dashboard.",
                status: "READ",
                createdAt: new Date(Date.now() - 86400000),
              },
              {
                conversationId: dmChat.id,
                senderId: adminId,
                content: "Of course! What would you like to know?",
                status: "READ",
                createdAt: new Date(Date.now() - 86400000 + 300000),
              },
              {
                conversationId: dmChat.id,
                senderId: qctoId,
                content: "How do I filter readiness reviews by province?",
                status: "READ",
                createdAt: new Date(Date.now() - 43200000),
              },
              {
                conversationId: dmChat.id,
                senderId: adminId,
                content: "You can use the province dropdown in the sidebar, or the filter bar on the Readiness page.",
                status: "READ",
                createdAt: new Date(Date.now() - 43200000 + 120000),
              },
              {
                conversationId: dmChat.id,
                senderId: adminId,
                content: "Let me know if you need any help with the dashboard.",
                status: "DELIVERED",
                createdAt: new Date(Date.now() - 7200000),
              },
            ],
          });

          console.log("Created DM between admin and QCTO user");
        }

        // Create a support chat for the institution
        if (instAdminId) {
          const supportChat = await prisma.conversation.create({
            data: {
              type: "SUPPORT",
              name: "Test Institution Support",
              isSupport: true,
              institutionId: institution.institution_id,
              createdBy: instAdminId,
              lastMessageAt: new Date(Date.now() - 1800000),
              lastMessageText: "Thanks for your help!",
              members: {
                create: [
                  { userId: instAdminId, role: "OWNER" },
                  { userId: adminId, role: "ADMIN" },
                ],
              },
            },
          });

          await prisma.message.createMany({
            data: [
              {
                conversationId: supportChat.id,
                senderId: instAdminId,
                content: "Hello, I need help with submitting our Form 5 readiness application.",
                status: "READ",
                createdAt: new Date(Date.now() - 86400000 * 3),
              },
              {
                conversationId: supportChat.id,
                senderId: adminId,
                content: "Hi! I'd be happy to help. What specific section are you having trouble with?",
                status: "READ",
                isAdminMessage: true,
                createdAt: new Date(Date.now() - 86400000 * 3 + 1800000),
              },
              {
                conversationId: supportChat.id,
                senderId: instAdminId,
                content: "The document upload section - some files are not uploading.",
                status: "READ",
                createdAt: new Date(Date.now() - 86400000 * 2),
              },
              {
                conversationId: supportChat.id,
                senderId: adminId,
                content: "Please make sure your files are under 10MB and in PDF, DOC, or image format. If you're still having issues, try a different browser.",
                status: "READ",
                isAdminMessage: true,
                createdAt: new Date(Date.now() - 86400000 * 2 + 600000),
              },
              {
                conversationId: supportChat.id,
                senderId: instAdminId,
                content: "That worked! Thanks for your help!",
                status: "DELIVERED",
                createdAt: new Date(Date.now() - 1800000),
              },
            ],
          });

          console.log("Created support chat for Test Institution");
        }
      } else {
        console.log("Chat demo data already exists, skipping...");
      }
    }
  } catch (err) {
    console.warn("⚠️ Chat demo data skipped (tables may be missing):", (err as Error).message);
  }

  // ========================================
  // ISSUE REPORTS SEED DATA (optional – skip if table missing)
  // ========================================
  try {
    console.log("\n🐛 Creating issue reports demo data...");

    const existingIssue = await prisma.issueReport.findFirst({
      where: { title: "Document upload fails for large PDF files" },
    });

    if (!existingIssue && chatUsers.length > 0) {
      const reporterId = userByEmail["instadmin@yibaverified.co.za"]?.user_id || chatUsers[0].user_id;
      const studentReporterId = userByEmail["student@yibaverified.co.za"]?.user_id;
      const qctoReporterId = userByEmail["qcto@yibaverified.co.za"]?.user_id;
      const adminId = userByEmail["admin@yibaverified.co.za"]?.user_id || chatUsers[0].user_id;

      await prisma.issueReport.createMany({
        data: [
          {
            reportedBy: reporterId,
            institutionId: institution.institution_id,
            category: "BUG",
            title: "Document upload fails for large PDF files",
            description: "When I try to upload a PDF file larger than 5MB, the upload fails with no error message. The progress bar reaches 100% but then nothing happens.",
            pageUrl: "/institution/readiness/new",
            status: "IN_PROGRESS",
            priority: "HIGH",
            assignedTo: adminId,
            createdAt: new Date(Date.now() - 86400000 * 5),
          },
          ...(studentReporterId ? [{
            reportedBy: studentReporterId,
            category: "ACCESS_ISSUE" as const,
            title: "Cannot access my enrolment details",
            description: "I'm trying to view my enrolment status for the current qualification but the page shows 'No enrolments found' even though I know I'm enrolled.",
            pageUrl: "/student/enrolments",
            status: "OPEN" as const,
            priority: "MEDIUM" as const,
            createdAt: new Date(Date.now() - 86400000 * 2),
          }] : []),
          ...(qctoReporterId ? [{
            reportedBy: qctoReporterId,
            category: "FEATURE_REQUEST" as const,
            title: "Add bulk export for readiness reviews",
            description: "It would be helpful to have a way to export all readiness reviews as a CSV or Excel file for reporting purposes.",
            pageUrl: "/qcto/readiness",
            status: "OPEN" as const,
            priority: "LOW" as const,
            createdAt: new Date(Date.now() - 86400000 * 7),
          }] : []),
          {
            reportedBy: reporterId,
            institutionId: institution.institution_id,
            category: "DATA_ISSUE",
            title: "Learner attendance percentages seem incorrect",
            description: "Some learners are showing 0% attendance even though attendance has been captured for them. I think the calculation might be wrong.",
            pageUrl: "/institution/learners",
            status: "RESOLVED",
            priority: "HIGH",
            resolution: "Fixed calculation bug in attendance percentage. Percentages now update correctly when attendance is captured.",
            resolvedAt: new Date(Date.now() - 86400000),
            createdAt: new Date(Date.now() - 86400000 * 10),
          },
        ],
      });

      console.log("Created issue reports demo data");
    } else {
      console.log("Issue reports demo data already exists, skipping...");
    }
  } catch (err) {
    console.warn("⚠️ Issue reports demo data skipped (table may be missing):", (err as Error).message);
  }

  // Default email templates (at least Institution Admin Invite for smart invite)
  // Default email templates - Seed ALL types
  const TEMPLATES_TO_SEED = [
    {
      type: "INSTITUTION_ADMIN_INVITE",
      name: "Institution Admin Invite",
      subject: "You're invited to manage {{institution_name}} on Yiba Verified",
      body_sections: [
        { type: "paragraph", content: "Hi {{recipient_name}}," },
        { type: "paragraph", content: "{{inviter_name}} has invited you to manage {{institution_name}} on Yiba Verified — the QCTO-recognised platform for qualification verification and accreditation." },
        { type: "paragraph", content: "We've introduced a new way to review your invitation details before accepting." },
        { type: "paragraph", content: "Click the button below to review your role and capabilities. This link expires in 7 days." },
      ],
      cta_text: "Review invitation", // Matches the Review flow
      footer_html: "If you didn't expect this invitation, you can safely ignore this email. Questions? Contact support@yibaverified.co.za",
    },
    {
      type: "INSTITUTION_STAFF_INVITE",
      name: "Institution Staff Invite",
      subject: "You're invited to join {{institution_name}} on Yiba Verified",
      body_sections: [
        { type: "paragraph", content: "Hi {{recipient_name}}," },
        { type: "paragraph", content: "{{inviter_name}} has invited you to join {{institution_name}} on Yiba Verified as a staff member." },
        { type: "paragraph", content: "You'll be able to assist with managing learners, uploading documents, and tracking submissions." },
        { type: "paragraph", content: "Click below to review your invitation and set up your account." },
      ],
      cta_text: "Review invitation",
      footer_html: "If you didn't expect this invitation, you can safely ignore this email. Questions? Contact support@yibaverified.co.za",
    },
    {
      type: "STUDENT_INVITE",
      name: "Student Invite",
      subject: "Invitation to join {{institution_name}} on Yiba Verified",
      body_sections: [
        { type: "paragraph", content: "Hi {{recipient_name}}," },
        { type: "paragraph", content: "{{institution_name}} has invited you to access your learner profile and digital records on Yiba Verified." },
        { type: "paragraph", content: "This is your secure portal for tracking your qualifications and achievements." },
        { type: "paragraph", content: "Please accept this invitation to create your account." },
      ],
      cta_text: "Accept Invitation",
      footer_html: "If you didn't expect this invitation, you can safely ignore this email. Questions? Contact support@yibaverified.co.za",
    },
    {
      type: "QCTO_INVITE",
      name: "QCTO User Invite",
      subject: "Invitation to Yiba Verified (QCTO Team)",
      body_sections: [
        { type: "paragraph", content: "Hi {{recipient_name}}," },
        { type: "paragraph", content: "You have been invited to join the Yiba Verified platform as a QCTO user." },
        { type: "paragraph", content: "Role: {{role}}" },
        { type: "paragraph", content: "Please click below to set up your secure access." },
      ],
      cta_text: "Setup Account",
      footer_html: "If you didn't expect this invitation, you can safely ignore this email. Questions? Contact support@yibaverified.co.za",
    },
    {
      type: "PLATFORM_ADMIN_INVITE",
      name: "Platform Admin Invite",
      subject: "Admin Access Invitation: Yiba Verified",
      body_sections: [
        { type: "paragraph", content: "Hi {{recipient_name}}," },
        { type: "paragraph", content: "You have been granted Platform Administrator access to Yiba Verified." },
        { type: "paragraph", content: "Please use the link below to configure your credentials." },
      ],
      cta_text: "Access Dashboard",
      footer_html: "This is a privileged access invitation. Do not forward.",
    },
  ];

  try {
    for (const t of TEMPLATES_TO_SEED) {
      // We use upsert to create or UPDATE existing templates to the new standard/design
      await prisma.emailTemplate.upsert({
        where: { type: t.type as any },
        create: {
          type: t.type as any,
          name: t.name,
          subject: t.subject,
          header_html: null,
          body_sections: t.body_sections as any,
          cta_text: t.cta_text,
          footer_html: t.footer_html,
          is_active: true,
        },
        update: {
          // Force update to ensure new design/copy is applied
          name: t.name,
          subject: t.subject,
          body_sections: t.body_sections as any,
          cta_text: t.cta_text,
          footer_html: t.footer_html,
        },
      });
    }
    console.log(`Seeded/Updated ${TEMPLATES_TO_SEED.length} email templates.`);
  } catch (err) {
    console.warn("⚠️ Email template seed skipped:", (err as Error).message);
  }

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
