/**
 * Script to generate a test student invite link
 * Usage: npx tsx scripts/generate-test-invite.ts
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // Get the first institution (or create a test one)
  let institution = await prisma.institution.findFirst({
    where: { deleted_at: null },
  });

  if (!institution) {
    console.log("❌ No institution found. Please create an institution first.");
    process.exit(1);
  }

  // Generate a test email
  const testEmail = `test-student-${Date.now()}@test.yibaverified.local`;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (existingUser) {
    console.log(`⚠️  User with email ${testEmail} already exists.`);
    console.log("   Please use a different email or delete the existing user.");
    process.exit(1);
  }

  // Generate secure token
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  // Set expiry to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create invite
  const invite = await prisma.invite.create({
    data: {
      email: testEmail,
      role: "STUDENT",
      institution_id: institution.institution_id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by_user_id: (await prisma.user.findFirst({ where: { role: "PLATFORM_ADMIN" } }))?.user_id || "",
      status: "QUEUED",
      max_attempts: 3,
    },
  });

  // Generate invite link
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const inviteLink = `${baseUrl}/invite?token=${rawToken}`;

  // Store token in token store (for development)
  // Note: This only works if the server is running, as token store is in-memory
  try {
    const { storeToken } = await import("../src/lib/invites/token-store");
    storeToken(tokenHash, rawToken, 168); // Store for 7 days
    console.log("✅ Token stored in memory (server must be running)");
  } catch (e) {
    console.log("⚠️  Could not store token in memory (server may not be running)");
    console.log("   The invite was created, but you'll need to use the API to get the link.");
  }

  console.log("\n✅ Test invite created successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 Email:", testEmail);
  console.log("🏫 Institution:", institution.trading_name || institution.legal_name);
  console.log("👤 Role: STUDENT");
  console.log("🆔 Invite ID:", invite.invite_id);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔗 Invite Link:");
  console.log(inviteLink);
  console.log("\n📋 Instructions:");
  console.log("   1. Make sure your dev server is running (npm run dev)");
  console.log("   2. Copy the invite link above");
  console.log("   3. Open it in an incognito/private tab");
  console.log("   4. Complete the onboarding flow");
  console.log("\n💡 Alternative: Use the Platform Admin invites page to create and get invite links");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
