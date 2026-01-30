/**
 * Fix Admin Login Script
 * 
 * This script ensures the platform admin account exists with the correct credentials.
 * Run with: npx tsx scripts/fix-admin-login.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("🔧 Fixing Platform Admin Login...\n");

  const email = "admin@yiba.local";
  const password = "Admin@12345";

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`✅ User found: ${email}`);
    console.log(`   Current role: ${existingUser.role}`);
    console.log(`   Current status: ${existingUser.status}`);
  } else {
    console.log(`❌ User not found: ${email}`);
  }

  // Update or create the admin account
  const hashedPassword = await hashPassword(password);
  
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password_hash: hashedPassword,
      first_name: "Platform",
      last_name: "Admin",
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
      default_province: null,
      assigned_provinces: [],
      onboarding_completed: true, // Skip onboarding redirect
    },
    create: {
      email,
      first_name: "Platform",
      last_name: "Admin",
      role: "PLATFORM_ADMIN",
      password_hash: hashedPassword,
      status: "ACTIVE",
      default_province: null,
      assigned_provinces: [],
      onboarding_completed: true, // Skip onboarding redirect
    },
  });

  console.log("\n✅ Platform Admin Account Fixed!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Login Credentials:");
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${admin.role}`);
  console.log(`   Status:   ${admin.status}`);
  console.log(`   User ID:  ${admin.user_id}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n💡 Try logging in now with:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
