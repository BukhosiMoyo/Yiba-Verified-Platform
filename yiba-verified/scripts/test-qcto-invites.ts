#!/usr/bin/env tsx
/**
 * Test script for QCTO invites
 * 
 * Usage:
 *   tsx scripts/test-qcto-invites.ts create --email test@example.com --name "Test User" --role QCTO_REVIEWER --province "Gauteng"
 *   tsx scripts/test-qcto-invites.ts list
 *   tsx scripts/test-qcto-invites.ts list --status PENDING
 *   tsx scripts/test-qcto-invites.ts show --email test@example.com
 */

import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { PROVINCES } from "../src/lib/provinces";

const prisma = new PrismaClient();

const QCTO_INVITE_ROLES = [
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
] as const;

const EXPIRY_DAYS = 7;

async function createInvite(options: {
  email: string;
  full_name: string;
  role: string;
  province?: string;
  qctoId?: string;
  invitedByUserId?: string;
}) {
  console.log("\n📧 Creating QCTO invite...");
  console.log("Options:", options);

  try {
    // Get or create QCTO org
    let qctoId = options.qctoId;
    if (!qctoId) {
      const org = await prisma.qCTOOrg.findFirst();
      if (!org) {
        console.error("❌ No QCTO organization found. Please create one first.");
        return;
      }
      qctoId = org.id;
    }

    // Get a user to use as inviter (or use provided one)
    let invitedByUserId = options.invitedByUserId;
    if (!invitedByUserId) {
      const user = await prisma.user.findFirst({
        where: {
          role: { in: ["QCTO_SUPER_ADMIN", "QCTO_ADMIN", "PLATFORM_ADMIN"] },
          deleted_at: null,
        },
      });
      if (!user) {
        console.error("❌ No QCTO user found to use as inviter. Please provide --invited-by-user-id");
        return;
      }
      invitedByUserId = user.user_id;
      console.log(`Using user ${user.email} as inviter`);
    }

    const emailNorm = options.email.trim().toLowerCase();
    const roleVal = options.role as (typeof QCTO_INVITE_ROLES)[number];

    if (!QCTO_INVITE_ROLES.includes(roleVal)) {
      console.error(`❌ Invalid role. Must be one of: ${QCTO_INVITE_ROLES.join(", ")}`);
      return;
    }

    // Check if pending invite already exists
    const existing = await prisma.qCTOInvite.findFirst({
      where: {
        qcto_id: qctoId,
        email: emailNorm,
        status: "PENDING",
      },
    });

    if (existing) {
      console.error("❌ A pending invite already exists for this email.");
      console.log("Existing invite:", {
        id: existing.id,
        created_at: existing.created_at,
        expires_at: existing.expires_at,
      });
      return;
    }

    // Generate secure token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

    const invite = await prisma.qCTOInvite.create({
      data: {
        qcto_id: qctoId,
        email: emailNorm,
        full_name: options.full_name.trim(),
        role: roleVal,
        province: options.province && options.province.trim() ? options.province.trim() : null,
        token_hash: tokenHash,
        status: "PENDING",
        expires_at: expiresAt,
        invited_by_user_id: invitedByUserId,
      },
    });

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const acceptUrl = `${base}/auth/qcto/accept-invite?token=${encodeURIComponent(rawToken)}`;

    console.log("✅ Invite created successfully!");
    console.log("\n📋 Invite Details:");
    console.log("  ID:", invite.id);
    console.log("  Email:", invite.email);
    console.log("  Full Name:", invite.full_name);
    console.log("  Role:", invite.role);
    console.log("  Province:", invite.province || "Not set");
    console.log("  Status:", invite.status);
    console.log("  Expires:", invite.expires_at.toLocaleString());
    console.log("\n💡 Accept URL:");
    console.log(`  ${acceptUrl}`);
    console.log("\n🔑 Token (for testing):");
    console.log(`  ${rawToken}`);
  } catch (error: any) {
    console.error("❌ Failed to create invite:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

async function listInvites(status?: string) {
  console.log("\n📋 Listing QCTO invites...");
  if (status) {
    console.log(`Filter: ${status}\n`);
  }

  try {
    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const invites = await prisma.qCTOInvite.findMany({
      where,
      include: {
        invitedBy: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        qctoOrg: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const total = await prisma.qCTOInvite.count({ where });

    console.log(`✅ Found ${total} invite(s)\n`);

    if (invites.length === 0) {
      console.log("  No invites found.");
      return;
    }

    invites.forEach((invite, index) => {
      console.log(`${index + 1}. ${invite.full_name} (${invite.email})`);
      console.log(`   Role: ${invite.role}`);
      console.log(`   Province: ${invite.province || "Not set"}`);
      console.log(`   Status: ${invite.status}`);
      console.log(`   Created: ${invite.created_at.toLocaleString()}`);
      console.log(`   Expires: ${invite.expires_at.toLocaleString()}`);
      if (invite.invitedBy) {
        const inviter = invite.invitedBy;
        const inviterName = inviter.first_name && inviter.last_name
          ? `${inviter.first_name} ${inviter.last_name}`
          : inviter.email;
        console.log(`   Invited by: ${inviterName} (${inviter.email})`);
      }
      if (invite.qctoOrg) {
        console.log(`   QCTO Org: ${invite.qctoOrg.name}`);
      }
      console.log("");
    });
  } catch (error: any) {
    console.error("❌ Failed to list invites:", error.message);
  }
}

async function showInvite(email: string) {
  console.log(`\n🔍 Looking up invite for: ${email}\n`);

  try {
    const invite = await prisma.qCTOInvite.findFirst({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: {
        invitedBy: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        qctoOrg: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    if (!invite) {
      console.log("❌ No invite found for this email.");
      return;
    }

    console.log("📋 Invite Details:");
    console.log("  ID:", invite.id);
    console.log("  Email:", invite.email);
    console.log("  Full Name:", invite.full_name);
    console.log("  Role:", invite.role);
    console.log("  Province:", invite.province || "Not set");
    console.log("  Status:", invite.status);
    console.log("  Created:", invite.created_at.toLocaleString());
    console.log("  Expires:", invite.expires_at.toLocaleString());
    if (invite.accepted_at) {
      console.log("  Accepted:", invite.accepted_at.toLocaleString());
    }
    if (invite.invitedBy) {
      const inviter = invite.invitedBy;
      const inviterName = inviter.first_name && inviter.last_name
        ? `${inviter.first_name} ${inviter.last_name}`
        : inviter.email;
      console.log("  Invited by:", inviterName, `(${inviter.email})`);
    }
    if (invite.qctoOrg) {
      console.log("  QCTO Org:", invite.qctoOrg.name);
    }
  } catch (error: any) {
    console.error("❌ Failed to show invite:", error.message);
  }
}

function showHelp() {
  console.log(`
QCTO Invites Test Script

Usage:
  tsx scripts/test-qcto-invites.ts <command> [options]

Commands:
  create              Create a new invite
  list                List all invites
  show                Show invite details for an email
  help                Show this help message

Create Options:
  --email <email>              Email address (required)
  --name <name>                Full name (required)
  --role <role>                 Role: QCTO_SUPER_ADMIN, QCTO_ADMIN, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER (default: QCTO_REVIEWER)
  --province <province>         Province (optional)
  --qcto-id <id>                QCTO organization ID (optional, uses first org if not provided)
  --invited-by-user-id <id>     User ID of inviter (optional, uses first QCTO user if not provided)

List Options:
  --status <status>             Filter by status: all, PENDING, ACCEPTED, EXPIRED, REVOKED (default: all)

Show Options:
  --email <email>               Email address to look up (required)

Examples:
  # Create invite with province
  tsx scripts/test-qcto-invites.ts create --email john@example.com --name "John Doe" --role QCTO_REVIEWER --province "Gauteng"

  # Create invite without province
  tsx scripts/test-qcto-invites.ts create --email jane@example.com --name "Jane Smith" --role QCTO_ADMIN

  # List all invites
  tsx scripts/test-qcto-invites.ts list

  # List pending invites
  tsx scripts/test-qcto-invites.ts list --status PENDING

  # Show invite details
  tsx scripts/test-qcto-invites.ts show --email john@example.com

Available Provinces:
${PROVINCES.map(p => `  - ${p}`).join("\n")}
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help") {
    showHelp();
    process.exit(0);
  }

  const options: any = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace("--", "");
    const value = args[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }

  if (command === "create") {
    if (!options.email || !options.name) {
      console.error("❌ Error: --email and --name are required");
      showHelp();
      process.exit(1);
    }
    return { command: "create", options };
  }

  if (command === "list") {
    return { command: "list", options };
  }

  if (command === "show") {
    if (!options.email) {
      console.error("❌ Error: --email is required");
      showHelp();
      process.exit(1);
    }
    return { command: "show", options };
  }

  console.error(`❌ Unknown command: ${command}`);
  showHelp();
  process.exit(1);
}

async function main() {
  const { command, options } = parseArgs();

  console.log("🔧 QCTO Invites Test Script\n");

  try {
    if (command === "create") {
      await createInvite({
        email: options.email,
        full_name: options.name,
        role: options.role || "QCTO_REVIEWER",
        province: options.province,
        qctoId: options.qctoId,
        invitedByUserId: options["invited-by-user-id"],
      });
    } else if (command === "list") {
      await listInvites(options.status || "all");
    } else if (command === "show") {
      await showInvite(options.email);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
