/**
 * DEMO DATA SEED — Realistic, large-scale, safe for demos
 *
 * Run ONLY when process.env.DEMO_MODE === "true".
 * All demo entities are identifiable via:
 *   - Institutions: registration_number LIKE 'DEMO-%'
 *   - Platform users: email LIKE '%@demo.yibaverified.local'
 *   - Qualifications: code LIKE 'DEMO-%'
 *
 * Does NOT modify: auth, permissions, workflows, API behaviour, or production seed.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// --- Seeded RNG (deterministic when seed is fixed) ---
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

let rng = createRng(42);
function resetRng() {
  rng = createRng(42);
}
function rand() {
  return rng();
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const shuf = [...arr].sort(() => rand() - 0.5);
  return shuf.slice(0, n);
}
function between(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
function randomDateInRange(daysStart: number, daysEnd: number): Date {
  const d = new Date();
  const t = daysAgo(between(daysEnd, daysStart)).getTime();
  return new Date(t);
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function uniqueTokenHash(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex");
}

// --- South African data pools ---

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

const INSTITUTION_TYPES = ["TVET", "PRIVATE_SDP", "NGO", "UNIVERSITY", "OTHER"] as const;
const DELIVERY_MODES = ["FACE_TO_FACE", "BLENDED", "MOBILE"] as const;

const MALE_FIRST = [
  "Thabo", "Sipho", "Bongani", "Mandla", "Sello", "Tshepo", "Kagiso", "Lucky", "Vusi", "Bheki",
  "Mbuso", "Nkosi", "Sello", "Nathi", "Zweli", "Phindi", "Themba", "Sanele", "Luyanda", "Ayanda",
];
const FEMALE_FIRST = [
  "Lerato", "Nomvula", "Zanele", "Thandi", "Nomsa", "Precious", "Sbongile", "Ntombi", "Nolwazi", "Busisiwe",
  "Sibongile", "Naledi", "Refilwe", "Nonhlanhla", "Mpho", "Zinhle", "Ayanda", "Lindiwe", "Zodwa", "Zanele",
];
const SURNAMES = [
  "Khumalo", "Dlamini", "Nkosi", "Ndlovu", "Sithole", "Mkhize", "Zulu", "Molefe", "Ntuli", "Mokoena",
  "van Wyk", "Botha", "Naidoo", "Pillay", "Govender", "Reddy", "Smith", "Johnson", "Williams", "Nkosi",
  "Mthembu", "Cele", "Mbatha", "Zungu", "Mthethwa", "Ngcobo", "Xaba", "Mbhele", "Ntombela", "Sithole",
];

const PLATFORM_ADMIN_NAMES: [string, string][] = [
  ["Thabo", "Mokoena"],
  ["Lerato", "Khumalo"],
  ["Sipho", "Dlamini"],
  ["Nomvula", "Nkosi"],
  ["Bongani", "Sithole"],
];

// Occupational qualifications (QCTO-style)
const QUALIFICATION_NAMES = [
  { name: "Occupational Certificate: Plumbing", code: "DEMO-OC-PLM" },
  { name: "Occupational Certificate: Electrical Engineering", code: "DEMO-OC-ELEC" },
  { name: "Occupational Certificate: Automotive Repair", code: "DEMO-OC-AUTO" },
  { name: "Occupational Certificate: ICT Support Technician", code: "DEMO-OC-ICT" },
  { name: "Occupational Certificate: Welding", code: "DEMO-OC-WELD" },
  { name: "Occupational Certificate: Early Childhood Development", code: "DEMO-OC-ECD" },
  { name: "Occupational Certificate: Fitting and Turning", code: "DEMO-OC-FIT" },
  { name: "Occupational Certificate: Bricklaying", code: "DEMO-OC-BRICK" },
  { name: "Occupational Certificate: Carpentry", code: "DEMO-OC-CARP" },
  { name: "Occupational Certificate: Diesel Mechanic", code: "DEMO-OC-DIES" },
  { name: "Occupational Certificate: Hospitality", code: "DEMO-OC-HOSP" },
  { name: "Occupational Certificate: Health and Safety", code: "DEMO-OC-OHS" },
  { name: "Occupational Certificate: Project Management", code: "DEMO-OC-PM" },
  { name: "Occupational Certificate: Bookkeeping", code: "DEMO-OC-BOOK" },
  { name: "Occupational Certificate: Hairdressing", code: "DEMO-OC-HAIR" },
];

const INSTITUTION_LEGAL_NAMES = [
  "Ubuntu Skills Training (Pty) Ltd", "Sizanani Education (Pty) Ltd", "Thuto Pele Academy (Pty) Ltd",
  "Khanyisa Learning Institute (Pty) Ltd", "Sefako Skills Development (Pty) Ltd", "Lephalala TVET College",
  "Mohloli Training Solutions (Pty) Ltd", "Realeboga Skills Academy (Pty) Ltd", "Kgotso Private College (Pty) Ltd",
  "Matla Vocational Centre (Pty) Ltd", "Bonani Education (Pty) Ltd", "Phetogo Skills (Pty) Ltd",
  "Tshepo Training (Pty) Ltd", "Karabo Learning (Pty) Ltd", "Lerato Academy (Pty) Ltd",
  "Thabang Skills Institute (Pty) Ltd", "Kgolo Training (Pty) Ltd", "Molefi SDP (Pty) Ltd",
  "Kabelo Technical College", "Refilwe Education (Pty) Ltd", "Naledi Skills (Pty) Ltd",
  "Tshedza Training (Pty) Ltd", "Omphemetse Academy (Pty) Ltd", "Mpho Learning (Pty) Ltd",
  "Kagiso Institute", "Bophelo Skills (Pty) Ltd", "Pula Training (Pty) Ltd", "Dumelang College (Pty) Ltd",
];

const INSTITUTION_TRADING = [
  "Ubuntu Skills Academy", "Sizanani Academy", "Thuto Pele", "Khanyisa Institute", "Sefako College",
  "Lephalala TVET", "Mohloli Training", "Realeboga Academy", "Kgotso College", "Matla Vocational",
  "Bonani Education", "Phetogo Skills", "Tshepo Training", "Karabo Learning", "Lerato Academy",
  "Thabang Institute", "Kgolo Training", "Molefi SDP", "Kabelo Technical", "Refilwe Education",
  "Naledi Skills", "Tshedza Training", "Omphemetse Academy", "Mpho Learning", "Kagiso Institute",
  "Bophelo Skills", "Pula Training", "Dumelang College",
];

// SA ID: YYMMDD SSSS C A Z (13 digits). We use 90s-00s birth dates and fake sequence/race/checksum.
function fakeSaId(birthDate: Date, i: number): string {
  const yy = String(birthDate.getFullYear()).slice(-2);
  const mm = String(birthDate.getMonth() + 1).padStart(2, "0");
  const dd = String(birthDate.getDate()).padStart(2, "0");
  const seq = String((5000 + i) % 10000).padStart(4, "0");
  const c = String((i % 8) + 0);
  const a = "8";
  const z = String((i % 10));
  return `${yy}${mm}${dd}${seq}${c}${a}${z}`;
}

// --- Counts for summary
const counts = {
  institutions: 0,
  users: 0,
  learners: 0,
  qualifications: 0,
  enrolments: 0,
  readiness: 0,
  submissions: 0,
  submissionResources: 0,
  auditLogs: 0,
  invites: 0,
};

export async function runDemoSeed(): Promise<typeof counts> {
  if (process.env.DEMO_MODE !== "true") {
    console.log("DEMO_MODE is not 'true'. Skipping demo seed.");
    return counts;
  }

  console.log("\n🌱 DEMO SEED — DEMO_MODE=true\n");

  resetRng();

  // 1) Qualifications (10–15)
  console.log("Creating qualifications…");
  const qualMap = new Map<string, string>();
  for (const q of QUALIFICATION_NAMES) {
    const existing = await prisma.qualification.findFirst({ where: { code: q.code } });
    if (existing) {
      qualMap.set(q.code, existing.qualification_id);
      continue;
    }
    const qual = await prisma.qualification.create({
      data: { name: q.name, code: q.code },
    });
    qualMap.set(q.code, qual.qualification_id);
    counts.qualifications++;
  }
  const qualIds = Array.from(qualMap.values());
  console.log(`  → ${counts.qualifications} new qualifications (${qualMap.size} total for demo).`);

  // 2) Institutions (20–30)
  const numInst = between(20, 30);
  console.log(`Creating ${numInst} institutions…`);
  const institutions: { id: string; registration_number: string; province: string; status: "APPROVED" | "DRAFT" | "SUSPENDED" }[] = [];
  const usedLegal = new Set<string>();
  const usedTrading = new Set<string>();

  for (let i = 0; i < numInst; i++) {
    const reg = `DEMO-${2023 + (i % 2)}-${String(i + 1).padStart(4, "0")}`;
    const existing = await prisma.institution.findFirst({ where: { registration_number: reg } });
    if (existing) {
      institutions.push({
        id: existing.institution_id,
        registration_number: reg,
        province: existing.province,
        status: existing.status as "APPROVED" | "DRAFT" | "SUSPENDED",
      });
      continue;
    }

    let legal = pick(INSTITUTION_LEGAL_NAMES);
    while (usedLegal.has(legal)) legal = pick(INSTITUTION_LEGAL_NAMES);
    usedLegal.add(legal);

    let trading = pick(INSTITUTION_TRADING);
    while (usedTrading.has(trading)) trading = pick(INSTITUTION_TRADING);
    usedTrading.add(trading);

    const statusRoll = rand();
    const status: "APPROVED" | "DRAFT" | "SUSPENDED" =
      statusRoll < 0.7 ? "APPROVED" : statusRoll < 0.9 ? "DRAFT" : "SUSPENDED";
    const province = PROVINCES[i % PROVINCES.length];
    const created = daysAgo(between(90, 540));

    const inst = await prisma.institution.create({
      data: {
        legal_name: legal,
        trading_name: trading,
        institution_type: pick(INSTITUTION_TYPES),
        registration_number: reg,
        physical_address: `${between(1, 999)} ${pick(["Main", "Church", "School", "Voortrekker", "Bree"])} Rd, ${pick(["Johannesburg", "Durban", "Cape Town", "Pretoria", "Port Elizabeth", "Bloemfontein", "Polokwane", "Nelspruit"])}`,
        province,
        delivery_modes: pickN([...DELIVERY_MODES], between(1, 3)) as ("FACE_TO_FACE" | "BLENDED" | "MOBILE")[],
        status,
        contact_person_name: `${pick(MALE_FIRST)} ${pick(SURNAMES)}`,
        contact_email: `contact${i}@${trading.toLowerCase().replace(/\s/g, "")}.co.za`,
        contact_number: `+27${between(60, 89)}${between(100, 999)}${between(1000, 9999)}`,
        created_at: created,
      },
    });
    institutions.push({ id: inst.institution_id, registration_number: reg, province: inst.province, status });
    counts.institutions++;
  }
  console.log(`  → ${counts.institutions} new institutions (${institutions.length} total).`);

  // 3) Platform admins (3–5) and at least one QCTO_USER for reviewed_by
  console.log("Creating platform and QCTO users…");
  const platformEmails: string[] = [];
  const platformAdmins: { user_id: string; email: string }[] = [];
  const numPlatform = between(3, 5);
  const pw = await hashPassword("Demo@123!");

  for (let i = 0; i < numPlatform; i++) {
    const [fn, ln] = PLATFORM_ADMIN_NAMES[i % PLATFORM_ADMIN_NAMES.length];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase().replace(/\s/g, "")}@demo.yibaverified.local`;
    platformEmails.push(email);
    const u = await prisma.user.upsert({
      where: { email },
      update: { password_hash: pw, first_name: fn, last_name: ln, role: "PLATFORM_ADMIN", status: "ACTIVE" },
      create: {
        email,
        first_name: fn,
        last_name: ln,
        role: "PLATFORM_ADMIN",
        password_hash: pw,
        status: "ACTIVE",
      },
    });
    platformAdmins.push({ user_id: u.user_id, email: u.email });
  }
  const qctoEmail = "qcto.demo@demo.yibaverified.local";
  const qctoUser = await prisma.user.upsert({
    where: { email: qctoEmail },
    update: { password_hash: pw },
    create: {
      email: qctoEmail,
      first_name: "QCTO",
      last_name: "Demo Reviewer",
      role: "QCTO_USER",
      password_hash: pw,
      status: "ACTIVE",
    },
  });
  const allPlatformOrQctoIds = [...platformAdmins.map((u) => u.user_id), qctoUser.user_id];
  console.log(`  → ${platformAdmins.length} PLATFORM_ADMIN, 1 QCTO_USER.`);

  // 4) Per-institution: 1 admin, 1–3 staff, 30–80 learners, readiness records, submissions
  const instUsers: { institution_id: string; admin: { user_id: string }; staff: { user_id: string }[] }[] = [];
  const allLearners: { learner_id: string; institution_id: string; national_id: string }[] = [];
  const allReadiness: { readiness_id: string; institution_id: string }[] = [];

  for (const inst of institutions) {
    const adminName = [pick(MALE_FIRST), pick(SURNAMES)];
    const slug = inst.registration_number.replace(/[^A-Z0-9]/g, "").toLowerCase().slice(0, 8);
    const adminEmail = `admin.${slug}@demo.yibaverified.local`;
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { institution_id: inst.id, first_name: adminName[0], last_name: adminName[1], role: "INSTITUTION_ADMIN", password_hash: pw, status: "ACTIVE" },
      create: {
        email: adminEmail,
        first_name: adminName[0],
        last_name: adminName[1],
        role: "INSTITUTION_ADMIN",
        institution_id: inst.id,
        password_hash: pw,
        status: "ACTIVE",
      },
    });

    const numStaff = between(1, 3);
    const staff: { user_id: string }[] = [];
    for (let s = 0; s < numStaff; s++) {
      const [fn, ln] = rand() < 0.5 ? [pick(MALE_FIRST), pick(SURNAMES)] : [pick(FEMALE_FIRST), pick(SURNAMES)];
      const email = `staff${s}.${slug}@demo.yibaverified.local`;
      const u = await prisma.user.upsert({
        where: { email },
        update: { institution_id: inst.id, first_name: fn, last_name: ln, role: "INSTITUTION_STAFF", password_hash: pw, status: "ACTIVE" },
        create: {
          email,
          first_name: fn,
          last_name: ln,
          role: "INSTITUTION_STAFF",
          institution_id: inst.id,
          password_hash: pw,
          status: "ACTIVE",
        },
      });
      staff.push({ user_id: u.user_id });
    }
    instUsers.push({ institution_id: inst.id, admin: { user_id: admin.user_id }, staff });

    const numLearners = between(32, 42); // ~800–1000 total across 20–30 institutions
    const learnerIds: string[] = [];
    for (let L = 0; L < numLearners; L++) {
      const isMale = rand() < 0.5;
      const first = isMale ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
      const last = pick(SURNAMES);
      const birthDate = randomDateInRange(365 * 18, 365 * 35);
      const nationalId = fakeSaId(birthDate, 10000 * institutions.indexOf(inst) + L);
      const existing = await prisma.learner.findUnique({ where: { national_id: nationalId } });
      if (existing) {
        learnerIds.push(existing.learner_id);
        allLearners.push({ learner_id: existing.learner_id, institution_id: inst.id, national_id: nationalId });
        continue;
      }
      const learner = await prisma.learner.create({
        data: {
          institution_id: inst.id,
          national_id: nationalId,
          first_name: first,
          last_name: last,
          birth_date: birthDate,
          gender_code: isMale ? "M" : "F",
          nationality_code: "ZA",
          home_language_code: pick(["EN", "ZU", "XH", "AF", "ST", "TN", "SS"]),
          popia_consent: true,
          consent_date: randomDateInRange(400, 700),
        },
      });
      learnerIds.push(learner.learner_id);
      allLearners.push({ learner_id: learner.learner_id, institution_id: inst.id, national_id: nationalId });
      counts.learners++;
    }

    // Enrolments: 70% ACTIVE, 15% COMPLETED, 10% TRANSFERRED, 5% ARCHIVED (maps to Graduated/Suspended/Dropped feel)
    const allEnrolmentIds: string[] = [];
    for (let e = 0; e < learnerIds.length; e++) {
      const existingEnr = await prisma.enrolment.findFirst({ where: { learner_id: learnerIds[e], institution_id: inst.id } });
      if (existingEnr) continue;
      const statusRoll = rand();
      const es: "ACTIVE" | "COMPLETED" | "TRANSFERRED" | "ARCHIVED" =
        statusRoll < 0.7 ? "ACTIVE" : statusRoll < 0.85 ? "COMPLETED" : statusRoll < 0.95 ? "TRANSFERRED" : "ARCHIVED";
      const q = pick(qualIds);
      const qual = await prisma.qualification.findUnique({ where: { qualification_id: q } });
      const start = randomDateInRange(365 * 2, 30);
      const end = new Date(start);
      end.setMonth(end.getMonth() + between(12, 24));
      const enr = await prisma.enrolment.create({
        data: {
          learner_id: learnerIds[e],
          institution_id: inst.id,
          qualification_id: q,
          qualification_title: qual!.name,
          start_date: start,
          expected_completion_date: end,
          enrolment_status: es,
          attendance_percentage: es === "ACTIVE" ? between(60, 100) : es === "COMPLETED" ? between(80, 100) : null,
        },
      });
      allEnrolmentIds.push(enr.enrolment_id);
      counts.enrolments++;
    }

    // Readiness (2–6 per institution)
    const numReadiness = between(2, 6);
    for (let r = 0; r < numReadiness; r++) {
      const q = pick(qualIds);
      const qual = await prisma.qualification.findUnique({ where: { qualification_id: q } });
      const rs: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "UNDER_REVIEW" | "RETURNED_FOR_CORRECTION" | "REVIEWED" | "RECOMMENDED" | "REJECTED" =
        rand() < 0.3 ? "RECOMMENDED" : rand() < 0.5 ? "UNDER_REVIEW" : rand() < 0.7 ? "SUBMITTED" : "IN_PROGRESS";
      const read = await prisma.readiness.create({
        data: {
          institution_id: inst.id,
          qualification_title: qual!.name,
          saqa_id: `SAQA-${between(10000, 99999)}`,
          nqf_level: between(2, 6),
          curriculum_code: `CUR-${between(100, 999)}`,
          delivery_mode: pick(DELIVERY_MODES),
          readiness_status: rs,
          submission_date: rs !== "NOT_STARTED" && rs !== "IN_PROGRESS" ? randomDateInRange(200, 400) : null,
          self_assessment_completed: rs !== "NOT_STARTED",
          learning_material_exists: rs !== "NOT_STARTED" ? rand() < 0.9 : null,
          curriculum_alignment_confirmed: rs === "RECOMMENDED" || rs === "REVIEWED" ? true : null,
        },
      });
      allReadiness.push({ readiness_id: read.readiness_id, institution_id: inst.id });
      counts.readiness++;
    }
  }

  counts.users = (await prisma.user.count({ where: { OR: [{ email: { contains: "@demo.yibaverified.local" } }, { institution: { registration_number: { startsWith: "DEMO-" } } }] } }));
  console.log(`  → Institution users, learners, enrolments, readiness created. Learners: ${counts.learners}, Enrolments: ${counts.enrolments}, Readiness: ${counts.readiness}.`);

  // 5) Submissions (300–600): Pending 30%, Approved 40%, Rejected 15%, Needs Changes 15%
  const numSubs = between(300, 600);
  console.log(`Creating ${numSubs} submissions…`);
  const subTypes = ["READINESS", "ACCREDITATION", "LEARNER_EVIDENCE", "COMPLIANCE_PACK", "ANNUAL_REPORT"] as const;
  const instWithUsers = instUsers;
  const allStaffAndAdminIds: string[] = [];
  instWithUsers.forEach((iu) => {
    allStaffAndAdminIds.push(iu.admin.user_id);
    iu.staff.forEach((s) => allStaffAndAdminIds.push(s.user_id));
  });

  for (let s = 0; s < numSubs; s++) {
    const inst = pick(institutions);
    const iu = instWithUsers.find((x) => x.institution_id === inst.id)!;
    const submitter = rand() < 0.6 ? iu.admin.user_id : pick(iu.staff).user_id;
    const roll = rand();
    const status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RETURNED_FOR_CORRECTION" =
      roll < 0.3 ? (rand() < 0.5 ? "SUBMITTED" : "UNDER_REVIEW") : roll < 0.7 ? "APPROVED" : roll < 0.85 ? "REJECTED" : "RETURNED_FOR_CORRECTION";
    const submittedAt = status !== "DRAFT" ? randomDateInRange(30, 450) : null;
    const reviewedAt = ["APPROVED", "REJECTED", "RETURNED_FOR_CORRECTION"].includes(status) ? (submittedAt ? new Date(submittedAt.getTime() + between(2, 14) * 24 * 60 * 60 * 1000) : randomDateInRange(30, 400)) : null;
    const reviewedBy = reviewedAt ? qctoUser.user_id : null;
    const reviewNotes = reviewedAt ? pick(["All requirements met. Approved.", "Minor formatting issues; otherwise compliant.", "Insufficient evidence for Section 5. Rejected.", "Please resubmit with updated OHS certificates.", "Approved with commendation."]) : null;

    const sub = await prisma.submission.create({
      data: {
        institution_id: inst.id,
        title: `${pick(subTypes)} – ${inst.registration_number} – ${between(1, 9999)}`,
        submission_type: pick(subTypes),
        status,
        submitted_at: submittedAt,
        submitted_by: submitter,
        reviewed_at: reviewedAt ?? undefined,
        reviewed_by: reviewedBy ?? undefined,
        review_notes: reviewNotes ?? undefined,
        created_at: submittedAt ? new Date(submittedAt.getTime() - between(1, 7) * 24 * 60 * 60 * 1000) : randomDateInRange(60, 400),
      },
    });
    counts.submissions++;

    // SubmissionResource: link 1–4 resources (readiness, learner, enrolment) from this institution
    const instReadiness = allReadiness.filter((r) => r.institution_id === inst.id);
    const instLearners = allLearners.filter((l) => l.institution_id === inst.id);
    const resTypes: ("READINESS" | "LEARNER" | "ENROLMENT")[] = [];
    if (instReadiness.length) resTypes.push("READINESS");
    if (instLearners.length) resTypes.push("LEARNER");
    resTypes.push("ENROLMENT");
    const toAdd = pickN(resTypes, between(1, Math.min(4, resTypes.length)));
    const added = new Set<string>();
    for (const rt of toAdd) {
      let rid: string;
      if (rt === "READINESS") rid = pick(instReadiness).readiness_id;
      else if (rt === "LEARNER") rid = pick(instLearners).learner_id;
      else {
        const enr = await prisma.enrolment.findFirst({ where: { institution_id: inst.id }, select: { enrolment_id: true } });
        rid = enr?.enrolment_id ?? pick(instLearners).learner_id;
      }
      const key = `${rt}:${rid}`;
      if (added.has(key)) continue;
      added.add(key);
      try {
        await prisma.submissionResource.create({
          data: {
            submission_id: sub.submission_id,
            resource_type: rt === "ENROLMENT" ? "ENROLMENT" : rt === "LEARNER" ? "LEARNER" : "READINESS",
            resource_id_value: rid,
            added_by: submitter,
          },
        });
        counts.submissionResources++;
      } catch {
        // unique constraint
      }
    }
  }
  console.log(`  → ${counts.submissions} submissions, ${counts.submissionResources} resources.`);

  // 6) Audit logs (thousands)
  const numAudit = between(2500, 5000);
  console.log(`Creating ${numAudit} audit logs…`);
  const entityTypes = ["INSTITUTION", "USER", "LEARNER", "ENROLMENT", "READINESS", "DOCUMENT"] as const;
  const changeTypes = ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"] as const;
  const actions = ["Institution approved", "Learner status changed", "Submission reviewed", "Feature enabled (DEMO)", "User invited", "Readiness submitted", "Enrolment created", "Document uploaded", "Status updated", "Record created"];

  for (let a = 0; a < numAudit; a++) {
    const inst = pick(institutions);
    const changerPool = [...allPlatformOrQctoIds, ...allStaffAndAdminIds];
    const changedBy = pick(changerPool);
    const u = await prisma.user.findUnique({ where: { user_id: changedBy }, select: { role: true } });
    const role = (u?.role ?? "PLATFORM_ADMIN") as "PLATFORM_ADMIN" | "QCTO_USER" | "INSTITUTION_ADMIN" | "INSTITUTION_STAFF" | "STUDENT";
    const entityType = pick(entityTypes);
    let entityId = inst.id;
    if (entityType === "LEARNER") entityId = pick(allLearners).learner_id;
    else if (entityType === "ENROLMENT") {
      const en = await prisma.enrolment.findFirst({ where: { institution_id: inst.id }, select: { enrolment_id: true } });
      entityId = en?.enrolment_id ?? inst.id;
    } else if (entityType === "READINESS") {
      const rr = allReadiness.find((r) => r.institution_id === inst.id);
      entityId = rr?.readiness_id ?? inst.id;
    }
    const sub = await prisma.submission.findFirst({ where: { institution_id: inst.id }, select: { submission_id: true } });
    await prisma.auditLog.create({
      data: {
        entity_type: entityType,
        entity_id: entityId,
        field_name: pick(["status", "name", "email", "enrolment_status", "readiness_status", "submission_type"]),
        old_value: rand() < 0.5 ? "null" : undefined,
        new_value: pick(["APPROVED", "ACTIVE", "SUBMITTED", "Updated"]),
        changed_by: changedBy,
        role_at_time: role,
        changed_at: randomDateInRange(90, 540),
        reason: rand() < 0.3 ? pick(actions) : undefined,
        institution_id: rand() < 0.8 ? inst.id : undefined,
        change_type: pick(changeTypes),
        related_submission_id: sub && rand() < 0.2 ? sub.submission_id : undefined,
      },
    });
    counts.auditLogs++;
  }
  console.log(`  → ${counts.auditLogs} audit logs.`);

  // 7) Invites (50–150): Sent, Opened, Accepted, Expired
  const numInv = between(50, 150);
  console.log(`Creating ${numInv} invites…`);
  for (let i = 0; i < numInv; i++) {
    const inst = pick(institutions);
    const iu = instWithUsers.find((x) => x.institution_id === inst.id)!;
    const creator = rand() < 0.7 ? iu.admin.user_id : pick(iu.staff).user_id;
    const roll = rand();
    const status: "SENT" | "DELIVERED" | "OPENED" | "ACCEPTED" | "EXPIRED" =
      roll < 0.35 ? "SENT" : roll < 0.5 ? "OPENED" : roll < 0.7 ? "ACCEPTED" : "EXPIRED";
    const sentAt = status !== "EXPIRED" ? randomDateInRange(14, 180) : randomDateInRange(60, 200);
    const expiresAt = new Date(sentAt);
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.invite.create({
      data: {
        email: `invite${i}.${randomBytes(4).toString("hex")}@demo-invite.co.za`,
        role: pick(["INSTITUTION_STAFF", "INSTITUTION_ADMIN", "STUDENT"] as const),
        institution_id: inst.id,
        token_hash: uniqueTokenHash(),
        expires_at: expiresAt,
        created_by_user_id: creator,
        status,
        sent_at: status !== "EXPIRED" ? sentAt : undefined,
        opened_at: status === "OPENED" || status === "ACCEPTED" ? new Date(sentAt.getTime() + 3600 * 1000) : undefined,
        accepted_at: status === "ACCEPTED" ? new Date(sentAt.getTime() + 7200 * 1000) : undefined,
        used_at: status === "ACCEPTED" ? new Date(sentAt.getTime() + 7200 * 1000) : undefined,
        attempts: 1,
      },
    });
    counts.invites++;
  }
  console.log(`  → ${counts.invites} invites.`);

  // Summary (totals for demo entities)
  const demoInstIds = (await prisma.institution.findMany({ where: { registration_number: { startsWith: "DEMO-" } }, select: { institution_id: true } })).map((i) => i.institution_id);
  const demoUserIds = (await prisma.user.findMany({ where: { OR: [{ email: { contains: "@demo.yibaverified.local" } }, { institution_id: { in: demoInstIds } }] }, select: { user_id: true } })).map((u) => u.user_id);
  const [instTotal, userTotal, learnerTotal, subTotal, auditTotal, invTotal] = await Promise.all([
    prisma.institution.count({ where: { registration_number: { startsWith: "DEMO-" } } }),
    prisma.user.count({ where: { OR: [{ email: { contains: "@demo.yibaverified.local" } }, { institution_id: { in: demoInstIds } }] } }),
    prisma.learner.count({ where: { institution_id: { in: demoInstIds } } }),
    prisma.submission.count({ where: { institution_id: { in: demoInstIds } } }),
    prisma.auditLog.count({ where: { OR: [{ institution_id: { in: demoInstIds } }, { changed_by: { in: demoUserIds } }] } }),
    prisma.invite.count({ where: { OR: [{ institution_id: { in: demoInstIds } }, { created_by_user_id: { in: demoUserIds } }] } }),
  ]);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  DEMO SEED SUMMARY (totals in DB)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Institutions:     ${instTotal}`);
  console.log(`  Users:            ${userTotal}`);
  console.log(`  Learners:         ${learnerTotal}`);
  console.log(`  Submissions:      ${subTotal}`);
  console.log(`  Audit logs:       ${auditTotal}`);
  console.log(`  Invites:          ${invTotal}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("✅ Demo seed complete.\n");

  await prisma.$disconnect();
  return counts;
}

// --- Wipe demo data (reverse dependency order) ---
export async function wipeDemoData(): Promise<void> {
  if (process.env.DEMO_MODE !== "true") {
    console.log("DEMO_MODE is not 'true'. Refusing to wipe.");
    return;
  }

  const demoInst = await prisma.institution.findMany({ where: { registration_number: { startsWith: "DEMO-" } }, select: { institution_id: true } });
  const demoInstIds = demoInst.map((i) => i.institution_id);
  const demoUsers = await prisma.user.findMany({
    where: { OR: [{ email: { contains: "@demo.yibaverified.local" } }, { institution_id: { in: demoInstIds } }] },
    select: { user_id: true },
  });
  const demoUserIds = demoUsers.map((u) => u.user_id);
  const demoLearners = await prisma.learner.findMany({ where: { institution_id: { in: demoInstIds } }, select: { learner_id: true } });
  const demoLearnerIds = demoLearners.map((l) => l.learner_id);
  const demoReadiness = await prisma.readiness.findMany({ where: { institution_id: { in: demoInstIds } }, select: { readiness_id: true } });
  const demoReadinessIds = demoReadiness.map((r) => r.readiness_id);
  const demoEnrolments = await prisma.enrolment.findMany({ where: { institution_id: { in: demoInstIds } }, select: { enrolment_id: true } });
  const demoEnrolmentIds = demoEnrolments.map((e) => e.enrolment_id);

  const demoDocIds = (
    await prisma.document.findMany({
      where: {
        OR: [
          { related_entity: "INSTITUTION", related_entity_id: { in: demoInstIds } },
          { related_entity: "LEARNER", related_entity_id: { in: demoLearnerIds } },
          { related_entity: "ENROLMENT", related_entity_id: { in: demoEnrolmentIds } },
          { related_entity: "READINESS", related_entity_id: { in: demoReadinessIds } },
        ],
      },
      select: { document_id: true },
    })
  ).map((d) => d.document_id);

  console.log("Wiping demo data…");
  if (demoDocIds.length) await prisma.evidenceFlag.deleteMany({ where: { document_id: { in: demoDocIds } } });
  if (demoDocIds.length) await prisma.document.deleteMany({ where: { document_id: { in: demoDocIds } } });
  await prisma.submissionResource.deleteMany({ where: { submission: { institution_id: { in: demoInstIds } } } });
  await prisma.submission.deleteMany({ where: { institution_id: { in: demoInstIds } } });
  await prisma.qCTORequestResource.deleteMany({ where: { request: { institution_id: { in: demoInstIds } } } });
  await prisma.qCTORequest.deleteMany({ where: { institution_id: { in: demoInstIds } } });
  await prisma.readinessRecommendation.deleteMany({ where: { readiness_id: { in: demoReadinessIds } } });
  await prisma.readiness.deleteMany({ where: { institution_id: { in: demoInstIds } } });
  await prisma.invite.deleteMany({ where: { OR: [{ institution_id: { in: demoInstIds } }, { created_by_user_id: { in: demoUserIds } }] } });
  await prisma.enrolment.deleteMany({ where: { institution_id: { in: demoInstIds } } });
  await prisma.learner.deleteMany({ where: { institution_id: { in: demoInstIds } } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ institution_id: { in: demoInstIds } }, { changed_by: { in: demoUserIds } }] } });
  await prisma.notification.deleteMany({ where: { user_id: { in: demoUserIds } } });
  await prisma.reviewComment.deleteMany({ where: { comment_by: { in: demoUserIds } } });
  await prisma.user.deleteMany({ where: { user_id: { in: demoUserIds } } });
  await prisma.institution.deleteMany({ where: { institution_id: { in: demoInstIds } } });
  await prisma.qualification.deleteMany({ where: { code: { startsWith: "DEMO-" } } });
  console.log("✅ Demo data wiped.");
  await prisma.$disconnect();
}
