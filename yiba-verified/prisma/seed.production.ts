/**
 * PRODUCTION-READY SEED — Realistic data for production testing
 * 
 * This script:
 * 1. Deletes ALL existing data from the database
 * 2. Creates comprehensive, realistic production-like data with:
 *    - @gmail.com emails for all users
 *    - Realistic South African phone numbers
 *    - All new fields populated with realistic data
 *    - Complete data across all entities
 * 
 * WARNING: This will DELETE ALL DATA in the database!
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { recomputeEnrolmentAttendancePercentage } from "../src/lib/attendance";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// Helper functions
async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function randomDateInRange(daysStart: number, daysEnd: number): Date {
  const days = randomInt(daysEnd, daysStart);
  return daysAgo(days);
}

// Generate realistic South African phone number
function generatePhoneNumber(): string {
  const prefixes = ["60", "61", "62", "63", "64", "65", "66", "67", "68", "71", "72", "73", "74", "76", "78", "79", "81", "82", "83", "84"];
  const prefix = randomItem(prefixes);
  const middle = String(randomInt(100, 999));
  const last = String(randomInt(1000, 9999));
  return `+27${prefix}${middle}${last}`;
}

// Generate realistic South African ID number
function generateSAID(birthDate: Date, index: number): string {
  const yy = String(birthDate.getFullYear()).slice(-2);
  const mm = String(birthDate.getMonth() + 1).padStart(2, "0");
  const dd = String(birthDate.getDate()).padStart(2, "0");
  const seq = String((5000 + index) % 10000).padStart(4, "0");
  const c = String((index % 8) + 0);
  const a = "8";
  const z = String((index % 10));
  return `${yy}${mm}${dd}${seq}${c}${a}${z}`;
}

// Data pools
const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const INSTITUTION_TYPES = ["TVET", "PRIVATE_SDP", "NGO", "UNIVERSITY", "EMPLOYER", "OTHER"] as const;
const DELIVERY_MODES = ["FACE_TO_FACE", "BLENDED", "MOBILE"] as const;

// Mixed names: African, Afrikaans, and English
const MALE_FIRST_NAMES = [
  // African names
  "Thabo", "Sipho", "Bongani", "Mandla", "Sello", "Tshepo", "Kagiso", "Lucky", "Vusi", "Bheki",
  "Mbuso", "Nkosi", "Nathi", "Zweli", "Phindi", "Themba", "Sanele", "Luyanda", "Ayanda", "Kabelo",
  "Tumelo", "Kgosi", "Refilwe", "Mpho", "Karabo", "Tshegofatso", "Lerato", "Pule", "Thapelo", "Kgotso",
  // Afrikaans names
  "Johan", "Pieter", "Willem", "Andries", "Hendrik", "Frik", "Dawie", "Kobus", "Stefan", "Gerhard",
  "Christo", "Dirk", "Jaco", "Riaan", "Wynand", "Francois", "Hannes", "Jannie", "Koos", "Piet",
  // English names
  "John", "Michael", "David", "James", "Robert", "William", "Richard", "Thomas", "Christopher", "Daniel",
  "Matthew", "Mark", "Andrew", "Steven", "Paul", "Kevin", "Brian", "Edward", "Anthony", "Peter",
];

const FEMALE_FIRST_NAMES = [
  // African names
  "Lerato", "Nomvula", "Zanele", "Thandi", "Nomsa", "Precious", "Sbongile", "Ntombi", "Nolwazi", "Busisiwe",
  "Sibongile", "Naledi", "Refilwe", "Nonhlanhla", "Mpho", "Zinhle", "Ayanda", "Lindiwe", "Zodwa", "Zanele",
  "Kgomotso", "Kelebogile", "Boitumelo", "Koketso", "Tshegofatso", "Karabo", "Palesa", "Masego", "Tumelo", "Refilwe",
  // Afrikaans names
  "Maria", "Anna", "Elize", "Petronella", "Susanna", "Magdalena", "Johanna", "Catharina", "Willemiena", "Elizabeth",
  "Hester", "Aletta", "Sarie", "Marietjie", "Annelie", "Elmarie", "Marike", "Elna", "Riana", "Elsa",
  // English names
  "Mary", "Sarah", "Jennifer", "Lisa", "Karen", "Susan", "Michelle", "Amanda", "Jessica", "Nicole",
  "Emily", "Emma", "Olivia", "Sophia", "Isabella", "Charlotte", "Mia", "Amelia", "Harper", "Evelyn",
];

const SURNAMES = [
  // African surnames
  "Khumalo", "Dlamini", "Nkosi", "Ndlovu", "Sithole", "Mkhize", "Zulu", "Molefe", "Ntuli", "Mokoena",
  "Mthembu", "Cele", "Mbatha", "Zungu", "Mthethwa", "Ngcobo", "Xaba", "Mbhele", "Ntombela", "Sithole",
  "Mabena", "Mahlangu", "Maseko", "Mashaba", "Mashiane", "Mashigo", "Mashile", "Masilela", "Masondo", "Mathebula",
  // Afrikaans surnames
  "van Wyk", "Botha", "van der Merwe", "Smit", "Meyer", "Fourie", "Coetzee", "van Niekerk", "Muller", "de Villiers",
  "Steyn", "Pretorius", "van den Berg", "du Plessis", "Venter", "Kruger", "van Rensburg", "Nel", "Ferreira", "Swart",
  "van Zyl", "de Klerk", "van der Walt", "Marais", "le Roux", "Theron", "van Heerden", "Botes", "Viljoen", "Jordaan",
  // English/Common surnames
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Naidoo", "Pillay", "Govender", "Reddy", "Patel", "Singh", "Kumar", "Peters", "Anderson", "Taylor",
];

const INSTITUTION_NAMES = [
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
];

const QUALIFICATIONS = [
  { name: "Occupational Certificate: Plumbing", code: "OC-PLM-001", saqa: "12345", nqf: 4 },
  { name: "Occupational Certificate: Electrical Engineering", code: "OC-ELEC-001", saqa: "12346", nqf: 4 },
  { name: "Occupational Certificate: Automotive Repair", code: "OC-AUTO-001", saqa: "12347", nqf: 3 },
  { name: "Occupational Certificate: ICT Support Technician", code: "OC-ICT-001", saqa: "12348", nqf: 4 },
  { name: "Occupational Certificate: Welding", code: "OC-WELD-001", saqa: "12349", nqf: 3 },
  { name: "Occupational Certificate: Early Childhood Development", code: "OC-ECD-001", saqa: "12350", nqf: 4 },
  { name: "Occupational Certificate: Fitting and Turning", code: "OC-FIT-001", saqa: "12351", nqf: 4 },
  { name: "Occupational Certificate: Bricklaying", code: "OC-BRICK-001", saqa: "12352", nqf: 3 },
  { name: "Occupational Certificate: Carpentry", code: "OC-CARP-001", saqa: "12353", nqf: 3 },
  { name: "Occupational Certificate: Diesel Mechanic", code: "OC-DIES-001", saqa: "12354", nqf: 4 },
  { name: "Occupational Certificate: Hospitality", code: "OC-HOSP-001", saqa: "12355", nqf: 3 },
  { name: "Occupational Certificate: Health and Safety", code: "OC-OHS-001", saqa: "12356", nqf: 4 },
  { name: "Occupational Certificate: Project Management", code: "OC-PM-001", saqa: "12357", nqf: 5 },
  { name: "Occupational Certificate: Bookkeeping", code: "OC-BOOK-001", saqa: "12358", nqf: 4 },
  { name: "Occupational Certificate: Hairdressing", code: "OC-HAIR-001", saqa: "12359", nqf: 3 },
];

const CITIES = [
  "Johannesburg", "Durban", "Cape Town", "Pretoria", "Port Elizabeth",
  "Bloemfontein", "Polokwane", "Nelspruit", "Kimberley", "East London",
];

const STREET_NAMES = [
  "Main", "Church", "School", "Voortrekker", "Bree", "Long", "High", "Park",
  "Victoria", "King", "Queen", "Market", "Station", "Railway", "Hospital",
];

const ETHNICITIES = ["BLACK", "COLOURED", "INDIAN", "WHITE", "OTHER"];
const DISABILITY_STATUSES = ["YES", "NO", "PREFER_NOT_TO_SAY"];
const NEXT_OF_KIN_RELATIONSHIPS = ["PARENT", "SPOUSE", "SIBLING", "GUARDIAN", "OTHER"];
const HOME_LANGUAGES = ["en", "zu", "xh", "af", "nso", "tn", "ve", "ts", "ss", "nr"];

// Delete all data in correct order (respecting foreign keys)
async function deleteAllData() {
  console.log("\n🗑️  Deleting all existing data...\n");

  // Delete in reverse dependency order
  await prisma.sickNote.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  await prisma.submissionReviewAttachment.deleteMany({});
  await prisma.submissionResource.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.qCTORequestResource.deleteMany({});
  await prisma.qCTORequest.deleteMany({});
  await prisma.evidenceFlag.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.pastQualification.deleteMany({});
  await prisma.priorLearning.deleteMany({});
  await prisma.readinessRecommendation.deleteMany({});
  await prisma.reviewComment.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.invite.deleteMany({});
  await prisma.qCTOInvite.deleteMany({});
  await prisma.onboardingProgress.deleteMany({});
  await prisma.enrolment.deleteMany({});
  await prisma.learner.deleteMany({});
  await prisma.readiness.deleteMany({});
  await prisma.qualification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.institution.deleteMany({});
  await prisma.qCTOOrg.deleteMany({});
  await prisma.verificationToken.deleteMany({});

  console.log("✅ All data deleted.\n");
}

export async function main() {
  console.log("\n🌱 PRODUCTION SEED — Creating realistic production data\n");
  console.log("⚠️  WARNING: This will DELETE ALL existing data!\n");

  // Delete all existing data
  await deleteAllData();

  const commonPassword = await hashPassword("Password123!");
  const counts = {
    institutions: 0,
    users: 0,
    learners: 0,
    qualifications: 0,
    enrolments: 0,
    readiness: 0,
    submissions: 0,
    documents: 0,
    auditLogs: 0,
    invites: 0,
    attendanceRecords: 0,
  };

  // 1. Create QCTO Organization
  console.log("Creating QCTO Organization...");
  const qctoOrg = await prisma.qCTOOrg.create({
    data: { name: "QCTO" },
  });
  console.log(`  ✅ Created QCTO Organization: ${qctoOrg.id}\n`);

  // 2. Create Qualifications
  console.log("Creating qualifications...");
  const qualificationMap = new Map<string, string>();
  for (const qual of QUALIFICATIONS) {
    const created = await prisma.qualification.create({
      data: {
        name: qual.name,
        code: qual.code,
      },
    });
    qualificationMap.set(qual.code, created.qualification_id);
    counts.qualifications++;
  }
  console.log(`  ✅ Created ${counts.qualifications} qualifications\n`);

  // 3. Create Platform Admins
  console.log("Creating platform administrators...");
  const platformAdmins: { user_id: string; email: string }[] = [];
  const platformAdminNames = [
    ["Thabo", "Mokoena"],
    ["Lerato", "Khumalo"],
    ["Sipho", "Dlamini"],
  ];

  for (let i = 0; i < platformAdminNames.length; i++) {
    const [firstName, lastName] = platformAdminNames[i];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;
    const user = await prisma.user.create({
      data: {
        email,
        first_name: firstName,
        last_name: lastName,
        role: "PLATFORM_ADMIN",
        password_hash: commonPassword,
        status: "ACTIVE",
        phone: generatePhoneNumber(),
        onboarding_completed: true,
        onboarding_completed_at: new Date(),
        // Platform admins don't need provincial assignments
        default_province: null,
        assigned_provinces: [],
        // Auto-verified with BLACK badge
        verification_level: "BLACK",
        verification_date: new Date(),
      },
    });
    platformAdmins.push({ user_id: user.user_id, email: user.email });
    counts.users++;
  }
  console.log(`  ✅ Created ${platformAdmins.length} platform administrators\n`);

  // 4. Create QCTO Users
  console.log("Creating QCTO users...");
  const qctoUsers: { user_id: string; email: string }[] = [];
  const qctoUserNames = [
    ["QCTO", "Super Admin"],
    ["QCTO", "Admin"],
    ["QCTO", "Reviewer"],
    ["QCTO", "Auditor"],
    ["QCTO", "Viewer"],
    ["QCTO", "User"],
  ];
  const qctoRoles: ("QCTO_SUPER_ADMIN" | "QCTO_ADMIN" | "QCTO_USER" | "QCTO_REVIEWER" | "QCTO_AUDITOR" | "QCTO_VIEWER")[] = [
    "QCTO_SUPER_ADMIN",
    "QCTO_ADMIN",
    "QCTO_USER",
    "QCTO_REVIEWER",
    "QCTO_AUDITOR",
    "QCTO_VIEWER",
  ];

  for (let i = 0; i < qctoUserNames.length; i++) {
    const [firstName, lastName] = qctoUserNames[i];
    const email = `qcto.${lastName.toLowerCase().replace(/\s/g, "")}${i > 0 ? i : ""}@gmail.com`;
    const role = qctoRoles[i];

    // QCTO_SUPER_ADMIN: no province required (can be national)
    // All other QCTO roles: require default_province
    const defaultProvince = role === "QCTO_SUPER_ADMIN" ? null : randomItem(PROVINCES);
    const assignedProvinces = role === "QCTO_SUPER_ADMIN"
      ? [] // National - no provinces assigned
      : role === "QCTO_ADMIN"
        ? [defaultProvince!, randomItem(PROVINCES.filter(p => p !== defaultProvince))] // Multiple provinces for QCTO_ADMIN
        : [defaultProvince!]; // Single province for others

    const user = await prisma.user.create({
      data: {
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        qcto_id: qctoOrg.id,
        password_hash: commonPassword,
        status: "ACTIVE",
        phone: generatePhoneNumber(),
        onboarding_completed: true,
        onboarding_completed_at: new Date(),
        default_province: defaultProvince,
        assigned_provinces: assignedProvinces,
      },
    });
    qctoUsers.push({ user_id: user.user_id, email: user.email });
    counts.users++;
  }
  console.log(`  ✅ Created ${qctoUsers.length} QCTO users\n`);

  // 5. Create Institutions with users
  console.log("Creating institutions...");
  const institutions: {
    id: string;
    admin: { user_id: string };
    staff: { user_id: string }[];
  }[] = [];

  for (let i = 0; i < INSTITUTION_NAMES.length; i++) {
    const instData = INSTITUTION_NAMES[i];
    const province = PROVINCES[i % PROVINCES.length];
    const city = randomItem(CITIES);
    const streetNum = randomInt(1, 999);
    const streetName = randomItem(STREET_NAMES);
    const postalCode = randomInt(1000, 9999);

    // Create institution
    const institution = await prisma.institution.create({
      data: {
        legal_name: instData.legal,
        trading_name: instData.trading,
        institution_type: randomItem([...INSTITUTION_TYPES]),
        registration_number: `REG-${2023 + (i % 2)}-${String(i + 1).padStart(4, "0")}`,
        physical_address: `${streetNum} ${streetName} Street, ${city}, ${postalCode}`,
        postal_address: `${streetNum} ${streetName} Street, ${city}, ${postalCode}`,
        province,
        delivery_modes: randomItems([...DELIVERY_MODES], randomInt(1, 3)) as ("FACE_TO_FACE" | "BLENDED" | "MOBILE")[],
        status: i < 12 ? "APPROVED" : i < 14 ? "DRAFT" : "SUSPENDED",
        contact_person_name: `${randomItem(MALE_FIRST_NAMES)} ${randomItem(SURNAMES)}`,
        contact_email: `contact${i}@gmail.com`,
        contact_number: generatePhoneNumber(),
      },
    });
    counts.institutions++;

    // Create institution admin
    const adminFirstName = randomItem(MALE_FIRST_NAMES);
    const adminLastName = randomItem(SURNAMES);
    const adminEmail = `admin.${instData.trading.toLowerCase().replace(/\s/g, "")}${i}@gmail.com`;
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        first_name: adminFirstName,
        last_name: adminLastName,
        role: "INSTITUTION_ADMIN",
        institution_id: institution.institution_id,
        password_hash: commonPassword,
        status: "ACTIVE",
        phone: generatePhoneNumber(),
        onboarding_completed: true,
        onboarding_completed_at: new Date(),
        // Institution users don't need provincial assignments (province comes from institution)
        default_province: null,
        assigned_provinces: [],
      },
    });
    counts.users++;

    // Create institution staff (1-3 per institution)
    const numStaff = randomInt(1, 3);
    const staff: { user_id: string }[] = [];
    for (let s = 0; s < numStaff; s++) {
      const isMale = Math.random() < 0.5;
      const firstName = isMale ? randomItem(MALE_FIRST_NAMES) : randomItem(FEMALE_FIRST_NAMES);
      const lastName = randomItem(SURNAMES);
      const staffEmail = `staff${s}.${instData.trading.toLowerCase().replace(/\s/g, "")}${i}@gmail.com`;
      const staffUser = await prisma.user.create({
        data: {
          email: staffEmail,
          first_name: firstName,
          last_name: lastName,
          role: "INSTITUTION_STAFF",
          institution_id: institution.institution_id,
          password_hash: commonPassword,
          status: "ACTIVE",
          phone: generatePhoneNumber(),
          onboarding_completed: true,
          onboarding_completed_at: new Date(),
          // Institution users don't need provincial assignments (province comes from institution)
          default_province: null,
          assigned_provinces: [],
        },
      });
      staff.push({ user_id: staffUser.user_id });
      counts.users++;
    }

    institutions.push({
      id: institution.institution_id,
      admin: { user_id: admin.user_id },
      staff,
    });
  }
  console.log(`  ✅ Created ${counts.institutions} institutions with ${counts.users - platformAdmins.length - qctoUsers.length} users\n`);

  // 6. Create Learners and Students
  console.log("Creating learners and student users...");
  const allLearners: { learner_id: string; institution_id: string; user_id?: string }[] = [];
  let learnerIndex = 0;

  for (const inst of institutions) {
    const numLearners = randomInt(25, 50); // 25-50 learners per institution

    for (let l = 0; l < numLearners; l++) {
      const isMale = Math.random() < 0.5;
      const firstName = isMale ? randomItem(MALE_FIRST_NAMES) : randomItem(FEMALE_FIRST_NAMES);
      const lastName = randomItem(SURNAMES);
      const birthDate = randomDateInRange(365 * 18, 365 * 35); // 18-35 years old
      const nationalId = generateSAID(birthDate, learnerIndex++);

      // Generate realistic address
      const streetNum = randomInt(1, 999);
      const streetName = randomItem(STREET_NAMES);
      const city = randomItem(CITIES);
      const postalCode = randomInt(1000, 9999);
      const address = `${streetNum} ${streetName} Street, ${city}, ${postalCode}`;
      const province = randomItem(PROVINCES);

      // Generate next of kin
      const nextOfKinFirst = randomItem(isMale ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES);
      const nextOfKinLast = Math.random() < 0.7 ? lastName : randomItem(SURNAMES);
      const nextOfKinName = `${nextOfKinFirst} ${nextOfKinLast}`;
      const nextOfKinRelationship = randomItem(NEXT_OF_KIN_RELATIONSHIPS);
      const nextOfKinPhone = generatePhoneNumber();
      const nextOfKinAddress = Math.random() < 0.5 ? address : `${randomInt(1, 999)} ${randomItem(STREET_NAMES)} Rd, ${city}, ${postalCode}`;

      // Create learner
      const learner = await prisma.learner.create({
        data: {
          institution_id: inst.id,
          national_id: nationalId,
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate,
          gender_code: isMale ? "M" : "F",
          nationality_code: "ZA",
          home_language_code: randomItem(HOME_LANGUAGES),
          disability_status: randomItem(DISABILITY_STATUSES),
          address,
          province,
          ethnicity: randomItem(ETHNICITIES),
          next_of_kin_name: nextOfKinName,
          next_of_kin_relationship: nextOfKinRelationship,
          next_of_kin_phone: nextOfKinPhone,
          next_of_kin_address: nextOfKinAddress,
          popia_consent: true,
          consent_date: randomDateInRange(400, 700),
          public_profile_enabled: Math.random() < 0.3,
          public_profile_id: Math.random() < 0.3 ? randomBytes(16).toString("hex") : null,
        },
      });
      counts.learners++;

      // Create student user for some learners (70%)
      if (Math.random() < 0.7) {
        const studentEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${l}@gmail.com`;
        const studentUser = await prisma.user.create({
          data: {
            email: studentEmail,
            first_name: firstName,
            last_name: lastName,
            role: "STUDENT",
            institution_id: inst.id,
            password_hash: commonPassword,
            status: "ACTIVE",
            phone: generatePhoneNumber(),
            onboarding_completed: true,
            onboarding_completed_at: new Date(),
            // Students don't need provincial assignments (province comes from learner/institution)
            default_province: null,
            assigned_provinces: [],
          },
        });

        // Link learner to user
        await prisma.learner.update({
          where: { learner_id: learner.learner_id },
          data: { user_id: studentUser.user_id },
        });

        allLearners.push({
          learner_id: learner.learner_id,
          institution_id: inst.id,
          user_id: studentUser.user_id,
        });
        counts.users++;
      } else {
        allLearners.push({
          learner_id: learner.learner_id,
          institution_id: inst.id,
        });
      }
    }
  }
  console.log(`  ✅ Created ${counts.learners} learners with ${allLearners.filter(l => l.user_id).length} student users\n`);

  // 7. Create Enrolments
  console.log("Creating enrolments...");
  const allEnrolments: { enrolment_id: string; institution_id: string; learner_id: string }[] = [];

  for (const inst of institutions) {
    const instLearners = allLearners.filter(l => l.institution_id === inst.id);

    for (const learner of instLearners) {
      // Each learner has 1-2 enrolments
      const numEnrolments = Math.random() < 0.8 ? 1 : 2;

      for (let e = 0; e < numEnrolments; e++) {
        const qualCode = randomItem(Array.from(qualificationMap.keys()));
        const qualificationId = qualificationMap.get(qualCode)!;
        const qual = QUALIFICATIONS.find(q => q.code === qualCode)!;

        const startDate = randomDateInRange(365 * 2, 30);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + randomInt(12, 24));

        const statusRoll = Math.random();
        const status: "ACTIVE" | "COMPLETED" | "TRANSFERRED" | "ARCHIVED" =
          statusRoll < 0.7 ? "ACTIVE" :
            statusRoll < 0.85 ? "COMPLETED" :
              statusRoll < 0.95 ? "TRANSFERRED" : "ARCHIVED";

        const enrolment = await prisma.enrolment.create({
          data: {
            learner_id: learner.learner_id,
            institution_id: inst.id,
            qualification_id: qualificationId,
            qualification_title: qual.name,
            start_date: startDate,
            expected_completion_date: endDate,
            enrolment_status: status,
            attendance_percentage: status === "ACTIVE" ? randomInt(60, 100) :
              status === "COMPLETED" ? randomInt(80, 100) : null,
            assessment_centre_code: `AC-${randomInt(1000, 9999)}`,
            readiness_status: status === "ACTIVE" ? "IN_PROGRESS" : "COMPLETED",
            flc_status: status === "ACTIVE" ? "PENDING" : "COMPLETED",
            statement_number: status === "COMPLETED" ? `STMT-${randomInt(10000, 99999)}` : null,
          },
        });

        allEnrolments.push({
          enrolment_id: enrolment.enrolment_id,
          institution_id: inst.id,
          learner_id: learner.learner_id,
        });
        counts.enrolments++;
      }
    }
  }
  console.log(`  ✅ Created ${counts.enrolments} enrolments\n`);

  // 8. Create Readiness Records
  console.log("Creating readiness records...");
  const allReadiness: { readiness_id: string; institution_id: string }[] = [];

  for (const inst of institutions) {
    const numReadiness = randomInt(3, 8);

    for (let r = 0; r < numReadiness; r++) {
      const qual = randomItem(QUALIFICATIONS);
      const qualId = qualificationMap.get(qual.code)!;

      const statusRoll = Math.random();
      const status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "UNDER_REVIEW" | "RETURNED_FOR_CORRECTION" | "REVIEWED" | "RECOMMENDED" | "REJECTED" =
        statusRoll < 0.1 ? "NOT_STARTED" :
          statusRoll < 0.3 ? "IN_PROGRESS" :
            statusRoll < 0.5 ? "SUBMITTED" :
              statusRoll < 0.65 ? "UNDER_REVIEW" :
                statusRoll < 0.75 ? "RETURNED_FOR_CORRECTION" :
                  statusRoll < 0.85 ? "REVIEWED" :
                    statusRoll < 0.95 ? "RECOMMENDED" : "REJECTED";

      const readiness = await prisma.readiness.create({
        data: {
          institution_id: inst.id,
          qualification_title: qual.name,
          saqa_id: qual.saqa,
          nqf_level: qual.nqf,
          curriculum_code: `CUR-${randomInt(100, 999)}`,
          delivery_mode: randomItem([...DELIVERY_MODES]),
          readiness_status: status,
          submission_date: status !== "NOT_STARTED" && status !== "IN_PROGRESS" ? randomDateInRange(200, 400) : null,
          self_assessment_completed: status !== "NOT_STARTED" && status !== "IN_PROGRESS",
          self_assessment_remarks: status !== "NOT_STARTED" && status !== "IN_PROGRESS" ? "Self-assessment completed with all requirements met." : null,
          registration_type: status !== "NOT_STARTED" ? "PROVISIONAL" : null,
          professional_body_registration: status !== "NOT_STARTED" ? Math.random() < 0.7 : null,
          training_site_address: `${randomInt(1, 999)} ${randomItem(STREET_NAMES)} Street, ${randomItem(CITIES)}`,
          ownership_type: status !== "NOT_STARTED" ? "OWNED" : null,
          number_of_training_rooms: status !== "NOT_STARTED" ? randomInt(2, 10) : null,
          room_capacity: status !== "NOT_STARTED" ? randomInt(15, 30) : null,
          facilitator_learner_ratio: status !== "NOT_STARTED" ? "1:15" : null,
          learning_material_exists: status !== "NOT_STARTED" ? Math.random() < 0.9 : null,
          knowledge_module_coverage: status !== "NOT_STARTED" ? randomInt(80, 100) : null,
          practical_module_coverage: status !== "NOT_STARTED" ? randomInt(75, 100) : null,
          curriculum_alignment_confirmed: status === "RECOMMENDED" ? true : status !== "NOT_STARTED" ? Math.random() < 0.8 : null,
          fire_extinguisher_available: status !== "NOT_STARTED" ? true : null,
          fire_extinguisher_service_date: status !== "NOT_STARTED" ? randomDateInRange(30, 180) : null,
          emergency_exits_marked: status !== "NOT_STARTED" ? true : null,
          accessibility_for_disabilities: status !== "NOT_STARTED" ? Math.random() < 0.8 : null,
          first_aid_kit_available: status !== "NOT_STARTED" ? true : null,
          ohs_representative_name: status !== "NOT_STARTED" ? `${randomItem(MALE_FIRST_NAMES)} ${randomItem(SURNAMES)}` : null,
          lms_name: status !== "NOT_STARTED" && Math.random() < 0.6 ? "Moodle" : null,
          max_learner_capacity: status !== "NOT_STARTED" && Math.random() < 0.6 ? randomInt(50, 200) : null,
          internet_connectivity_method: status !== "NOT_STARTED" && Math.random() < 0.6 ? "FIBRE" : null,
          isp: status !== "NOT_STARTED" && Math.random() < 0.6 ? "Vodacom" : null,
          backup_frequency: status !== "NOT_STARTED" && Math.random() < 0.6 ? "DAILY" : null,
          data_storage_description: status !== "NOT_STARTED" && Math.random() < 0.6 ? "Cloud-based storage with daily backups" : null,
          security_measures_description: status !== "NOT_STARTED" && Math.random() < 0.6 ? "SSL encryption, two-factor authentication" : null,
          wbl_workplace_partner_name: status !== "NOT_STARTED" && Math.random() < 0.5 ? `${randomItem(CITIES)} Industries` : null,
          wbl_agreement_type: status !== "NOT_STARTED" && Math.random() < 0.5 ? "FORMAL" : null,
          wbl_agreement_duration: status !== "NOT_STARTED" && Math.random() < 0.5 ? "12 months" : null,
          wbl_components_covered: status !== "NOT_STARTED" && Math.random() < 0.5 ? "Practical skills, workplace assessment" : null,
          wbl_learner_support_description: status !== "NOT_STARTED" && Math.random() < 0.5 ? "Regular mentorship and progress reviews" : null,
          wbl_assessment_responsibility: status !== "NOT_STARTED" && Math.random() < 0.5 ? "SHARED" : null,
          policies_procedures_notes: status !== "NOT_STARTED" ? "All policies and procedures documented and available" : null,
          // New Form 5 fields
          credits: status !== "NOT_STARTED" ? randomInt(120, 360) : null,
          occupational_category: status !== "NOT_STARTED" ? randomItem(["Engineering", "Healthcare", "Education", "Business", "Technology"]) : null,
          intended_learner_intake: status !== "NOT_STARTED" ? randomInt(20, 100) : null,
          // LMIS fields
          lmis_functional: status !== "NOT_STARTED" ? Math.random() < 0.9 : null,
          lmis_popia_compliant: status !== "NOT_STARTED" ? Math.random() < 0.9 : null,
          lmis_data_storage_description: status !== "NOT_STARTED" && Math.random() < 0.7 ? "Secure cloud storage with encrypted backups" : null,
          lmis_access_control_description: status !== "NOT_STARTED" && Math.random() < 0.7 ? "Role-based access control with audit logging" : null,
          // Learning Material fields (Form 5 Section 9)
          learning_material_coverage_percentage: status !== "NOT_STARTED" ? randomInt(50, 100) : null,
          learning_material_nqf_aligned: status !== "NOT_STARTED" ? Math.random() < 0.9 : null,
          knowledge_components_complete: status !== "NOT_STARTED" ? Math.random() < 0.9 : null,
          practical_components_complete: status !== "NOT_STARTED" ? Math.random() < 0.9 : null,
          learning_material_quality_verified: status === "RECOMMENDED" ? true : status !== "NOT_STARTED" ? Math.random() < 0.8 : null,
        },
      });

      allReadiness.push({
        readiness_id: readiness.readiness_id,
        institution_id: inst.id,
      });
      counts.readiness++;
    }
  }
  console.log(`  ✅ Created ${counts.readiness} readiness records\n`);

  // 9. Create Submissions
  console.log("Creating submissions...");
  const submissionTypes = ["READINESS", "ACCREDITATION", "LEARNER_EVIDENCE", "COMPLIANCE_PACK", "ANNUAL_REPORT"] as const;

  for (const inst of institutions) {
    const numSubmissions = randomInt(5, 15);
    const instUsers = [inst.admin, ...inst.staff];

    for (let s = 0; s < numSubmissions; s++) {
      const submitter = randomItem(instUsers);
      const statusRoll = Math.random();
      const status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RETURNED_FOR_CORRECTION" =
        statusRoll < 0.2 ? "DRAFT" :
          statusRoll < 0.4 ? "SUBMITTED" :
            statusRoll < 0.5 ? "UNDER_REVIEW" :
              statusRoll < 0.75 ? "APPROVED" :
                statusRoll < 0.9 ? "REJECTED" : "RETURNED_FOR_CORRECTION";

      const submittedAt = status !== "DRAFT" ? randomDateInRange(30, 450) : null;
      const reviewedAt = ["APPROVED", "REJECTED", "RETURNED_FOR_CORRECTION"].includes(status) && submittedAt
        ? new Date(submittedAt.getTime() + randomInt(2, 14) * 24 * 60 * 60 * 1000)
        : null;
      const reviewedBy = reviewedAt ? randomItem(qctoUsers).user_id : null;

      const submission = await prisma.submission.create({
        data: {
          institution_id: inst.id,
          title: `${randomItem(submissionTypes)} – ${inst.id.slice(0, 8)} – ${randomInt(1, 9999)}`,
          submission_type: randomItem(submissionTypes),
          status,
          submitted_at: submittedAt,
          submitted_by: submitter.user_id,
          reviewed_at: reviewedAt,
          reviewed_by: reviewedBy,
          review_notes: reviewedAt ? randomItem([
            "All requirements met. Approved.",
            "Minor formatting issues; otherwise compliant.",
            "Insufficient evidence for Section 5. Rejected.",
            "Please resubmit with updated OHS certificates.",
            "Approved with commendation.",
          ]) : null,
        },
      });
      counts.submissions++;

      // Add resources to submission
      const instReadiness = allReadiness.filter(r => r.institution_id === inst.id);
      const instLearners = allLearners.filter(l => l.institution_id === inst.id);
      const instEnrolments = allEnrolments.filter(e => e.institution_id === inst.id);

      const numResources = randomInt(1, 4);
      const addedResources = new Set<string>();

      for (let res = 0; res < numResources; res++) {
        let resourceType: "READINESS" | "LEARNER" | "ENROLMENT";
        let resourceId: string;

        if (instReadiness.length > 0 && Math.random() < 0.4) {
          resourceType = "READINESS";
          resourceId = randomItem(instReadiness).readiness_id;
        } else if (instLearners.length > 0 && Math.random() < 0.5) {
          resourceType = "LEARNER";
          resourceId = randomItem(instLearners).learner_id;
        } else if (instEnrolments.length > 0) {
          resourceType = "ENROLMENT";
          resourceId = randomItem(instEnrolments).enrolment_id;
        } else {
          continue;
        }

        const key = `${resourceType}:${resourceId}`;
        if (addedResources.has(key)) continue;
        addedResources.add(key);

        try {
          await prisma.submissionResource.create({
            data: {
              submission_id: submission.submission_id,
              resource_type: resourceType,
              resource_id_value: resourceId,
              added_by: submitter.user_id,
              notes: `Resource added for ${resourceType.toLowerCase()} review`,
            },
          });
        } catch {
          // Skip if duplicate
        }
      }
    }
  }
  console.log(`  ✅ Created ${counts.submissions} submissions\n`);

  // 10. Create Attendance Records
  console.log("Creating attendance records...");
  const activeEnrolments = allEnrolments.filter(e => {
    const enr = allEnrolments.find(en => en.enrolment_id === e.enrolment_id);
    return enr; // We'll check status in the query
  });

  const someEnrolments = await prisma.enrolment.findMany({
    where: {
      enrolment_id: { in: activeEnrolments.slice(0, 20).map(e => e.enrolment_id) },
      enrolment_status: "ACTIVE",
    },
    take: 20,
  });

  const attendanceStatuses = ["PRESENT", "PRESENT", "PRESENT", "LATE", "EXCUSED", "ABSENT"] as const;

  for (const enr of someEnrolments) {
    const inst = institutions.find(i => i.id === enr.institution_id);
    if (!inst) continue;

    const markedBy = Math.random() < 0.5 || inst.staff.length === 0
      ? inst.admin.user_id
      : randomItem(inst.staff).user_id;

    const start = Math.max(enr.start_date.getTime(), Date.now() - 21 * 24 * 60 * 60 * 1000);
    const end = enr.expected_completion_date
      ? Math.min(enr.expected_completion_date.getTime(), Date.now())
      : Date.now();

    const numDays = randomInt(5, 15);
    for (let i = 0; i < numDays; i++) {
      const d = new Date(start + (i / Math.max(numDays - 1, 1)) * (end - start));
      d.setHours(0, 0, 0, 0);
      const status = randomItem(attendanceStatuses);

      try {
        await prisma.attendanceRecord.create({
          data: {
            enrolment_id: enr.enrolment_id,
            record_date: d,
            status,
            marked_by: markedBy,
            notes: status === "EXCUSED" || status === "ABSENT" ? "Medical certificate provided" : null,
          },
        });
        counts.attendanceRecords++;
      } catch {
        // Skip duplicates
      }
    }

    // Recompute attendance percentage
    try {
      await recomputeEnrolmentAttendancePercentage(prisma, enr.enrolment_id);
    } catch {
      // Ignore errors
    }
  }
  console.log(`  ✅ Created ${counts.attendanceRecords} attendance records\n`);

  // Default email templates - Seed ALL types
  const { seedEmailTemplates } = await import("./seed.templates");
  await seedEmailTemplates(prisma);

  // 11. Create Invites
  console.log("Creating invites...");
  for (const inst of institutions) {
    const numInvites = randomInt(3, 8);
    const instUsers = [inst.admin, ...inst.staff];

    for (let i = 0; i < numInvites; i++) {
      const creator = randomItem(instUsers);
      const statusRoll = Math.random();
      const status: "QUEUED" | "SENT" | "DELIVERED" | "OPENED" | "ACCEPTED" | "DECLINED" | "FAILED" | "EXPIRED" =
        statusRoll < 0.2 ? "QUEUED" :
          statusRoll < 0.32 ? "SENT" :
            statusRoll < 0.42 ? "DELIVERED" :
              statusRoll < 0.55 ? "OPENED" :
                statusRoll < 0.75 ? "ACCEPTED" :
                  statusRoll < 0.82 ? "DECLINED" :
                    statusRoll < 0.9 ? "FAILED" : "EXPIRED";

      const sentAt = status !== "QUEUED" && status !== "EXPIRED" ? randomDateInRange(14, 180) : null;
      const expiresAt = sentAt ? new Date(sentAt.getTime() + 7 * 24 * 60 * 60 * 1000) : daysAgo(randomInt(60, 200));

      const declinedAt = status === "DECLINED" && sentAt ? new Date(sentAt.getTime() + 5400 * 1000) : null;
      await prisma.invite.create({
        data: {
          email: `invite${i}.${randomBytes(4).toString("hex")}@gmail.com`,
          role: randomItem(["INSTITUTION_STAFF", "INSTITUTION_ADMIN", "STUDENT"]),
          institution_id: inst.id,
          token_hash: randomBytes(32).toString("hex"),
          expires_at: expiresAt,
          created_by_user_id: creator.user_id,
          status,
          sent_at: sentAt,
          delivered_at: status === "DELIVERED" || status === "OPENED" || status === "ACCEPTED" || status === "DECLINED" ? sentAt ? new Date(sentAt.getTime() + 3600 * 1000) : null : null,
          opened_at: status === "OPENED" || status === "ACCEPTED" || status === "DECLINED" ? sentAt ? new Date(sentAt.getTime() + 7200 * 1000) : null : null,
          accepted_at: status === "ACCEPTED" ? sentAt ? new Date(sentAt.getTime() + 10800 * 1000) : null : null,
          declined_at: declinedAt,
          decline_reason: status === "DECLINED" ? randomItem(["already_using_other_platform", "not_responsible", "not_interested", "other"]) : null,
          used_at: status === "ACCEPTED" ? sentAt ? new Date(sentAt.getTime() + 10800 * 1000) : null : null,
          attempts: status !== "QUEUED" ? 1 : 0,
        },
      });
      counts.invites++;
    }
  }
  console.log(`  ✅ Created ${counts.invites} invites\n`);

  // 12. Create Audit Logs
  console.log("Creating audit logs...");
  const entityTypes = ["INSTITUTION", "USER", "LEARNER", "ENROLMENT", "READINESS", "DOCUMENT"] as const;
  const changeTypes = ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"] as const;
  const numAuditLogs = randomInt(500, 1000);

  const allUserIds = [
    ...platformAdmins.map(u => u.user_id),
    ...qctoUsers.map(u => u.user_id),
    ...institutions.flatMap(i => [i.admin.user_id, ...i.staff.map(s => s.user_id)]),
  ];

  for (let a = 0; a < numAuditLogs; a++) {
    const inst = randomItem(institutions);
    const changedBy = randomItem(allUserIds);
    const user = await prisma.user.findUnique({ where: { user_id: changedBy }, select: { role: true } });
    const role = (user?.role ?? "PLATFORM_ADMIN") as any;

    const entityType = randomItem(entityTypes);
    let entityId = inst.id;

    if (entityType === "LEARNER") {
      const learner = randomItem(allLearners.filter(l => l.institution_id === inst.id));
      entityId = learner?.learner_id ?? inst.id;
    } else if (entityType === "ENROLMENT") {
      const enr = randomItem(allEnrolments.filter(e => e.institution_id === inst.id));
      entityId = enr?.enrolment_id ?? inst.id;
    } else if (entityType === "READINESS") {
      const read = randomItem(allReadiness.filter(r => r.institution_id === inst.id));
      entityId = read?.readiness_id ?? inst.id;
    }

    await prisma.auditLog.create({
      data: {
        entity_type: entityType,
        entity_id: entityId,
        field_name: randomItem(["status", "name", "email", "enrolment_status", "readiness_status", "submission_type"]),
        old_value: Math.random() < 0.5 ? "null" : undefined,
        new_value: randomItem(["APPROVED", "ACTIVE", "SUBMITTED", "Updated", "COMPLETED"]),
        changed_by: changedBy,
        role_at_time: role,
        changed_at: randomDateInRange(90, 540),
        reason: Math.random() < 0.3 ? randomItem([
          "Institution approved",
          "Learner status changed",
          "Submission reviewed",
          "User invited",
          "Readiness submitted",
          "Enrolment created",
          "Document uploaded",
          "Status updated",
        ]) : undefined,
        institution_id: Math.random() < 0.8 ? inst.id : undefined,
        change_type: randomItem(changeTypes),
      },
    });
    counts.auditLogs++;
  }
  console.log(`  ✅ Created ${counts.auditLogs} audit logs\n`);

  // Summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PRODUCTION SEED SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Institutions:     ${counts.institutions}`);
  console.log(`  Users:            ${counts.users}`);
  console.log(`  Learners:         ${counts.learners}`);
  console.log(`  Qualifications:   ${counts.qualifications}`);
  console.log(`  Enrolments:       ${counts.enrolments}`);
  console.log(`  Readiness:        ${counts.readiness}`);
  console.log(`  Submissions:      ${counts.submissions}`);
  console.log(`  Attendance:       ${counts.attendanceRecords}`);
  console.log(`  Invites:          ${counts.invites}`);
  console.log(`  Audit Logs:       ${counts.auditLogs}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Get all user emails for summary
  const allUsers = await prisma.user.findMany({
    select: { email: true, role: true, institution_id: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  console.log("📋 LOGIN CREDENTIALS (All use password: Password123!)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔑 PLATFORM ADMINS:");
  allUsers.filter(u => u.role === "PLATFORM_ADMIN").forEach(u => {
    console.log(`   ${u.email}`);
  });
  console.log("\n🔑 QCTO USERS:");
  allUsers.filter(u => u.role.startsWith("QCTO")).forEach(u => {
    console.log(`   ${u.email} (${u.role})`);
  });
  console.log("\n🔑 INSTITUTION ADMINS (sample - first 5):");
  allUsers.filter(u => u.role === "INSTITUTION_ADMIN").slice(0, 5).forEach(u => {
    console.log(`   ${u.email}`);
  });
  console.log("\n🔑 INSTITUTION STAFF (sample - first 5):");
  allUsers.filter(u => u.role === "INSTITUTION_STAFF").slice(0, 5).forEach(u => {
    console.log(`   ${u.email}`);
  });
  console.log("\n🔑 STUDENTS (sample - first 5):");
  allUsers.filter(u => u.role === "STUDENT").slice(0, 5).forEach(u => {
    console.log(`   ${u.email}`);
  });
  console.log("\n✅ Production seed complete!\n");
}

// Only execute if run directly (not when imported via seed.ts)
if (require.main === module) {
  main()
    .catch((e) => {
      console.error("❌ Error seeding database:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
