// POST /api/invites/bulk - Create multiple invites in bulk (PLATFORM_ADMIN or INSTITUTION_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { randomBytes, createHash } from "crypto";

interface BulkInviteItem {
  email: string;
  role: string;
  institution_id?: string;
}

/**
 * POST /api/invites/bulk
 * Creates multiple invites in bulk (PLATFORM_ADMIN or INSTITUTION_ADMIN only).
 * 
 * Body: {
 *   invites: Array<{ email, role, institution_id? }>,
 *   batch_id?: string // Optional batch identifier
 * }
 * 
 * RBAC:
 * - PLATFORM_ADMIN can invite anyone
 * - INSTITUTION_ADMIN can invite INSTITUTION_STAFF and STUDENT only (scoped to their institution)
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Only PLATFORM_ADMIN or INSTITUTION_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN" && ctx.role !== "INSTITUTION_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN or INSTITUTION_ADMIN can create bulk invites",
        403
      );
    }

    const body = await request.json();
    const { invites, batch_id } = body;

    // Validation
    if (!Array.isArray(invites) || invites.length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invites array is required and must not be empty",
        400
      );
    }

    if (invites.length > 1000) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Maximum 1000 invites per bulk request",
        400
      );
    }

    // Generate batch ID if not provided
    const finalBatchId = batch_id || `batch_${Date.now()}_${randomBytes(8).toString("hex")}`;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Process invites
    const processedInvites: any[] = [];
    const errors: Array<{ email: string; error: string }> = [];

    for (const item of invites) {
      try {
        const { email, role, institution_id } = item;

        // Validation
        if (!email || !role) {
          errors.push({ email: email || "unknown", error: "Email and role are required" });
          continue;
        }

        if (!emailRegex.test(email)) {
          errors.push({ email, error: "Invalid email format" });
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (existingUser && !existingUser.deleted_at) {
          errors.push({ email, error: "User with this email already exists" });
          continue;
        }

        // Role validation based on caller
        let finalInstitutionId = institution_id;

        if (ctx.role === "INSTITUTION_ADMIN") {
          // INSTITUTION_ADMIN can only invite INSTITUTION_STAFF and STUDENT
          if (role !== "INSTITUTION_STAFF" && role !== "STUDENT") {
            errors.push({
              email,
              error: "INSTITUTION_ADMIN can only invite INSTITUTION_STAFF and STUDENT",
            });
            continue;
          }
          // Use their institution_id
          if (!ctx.institutionId) {
            errors.push({
              email,
              error: "Institution ID is required for institution-scoped invites",
            });
            continue;
          }
          finalInstitutionId = ctx.institutionId;
        } else if (ctx.role === "PLATFORM_ADMIN") {
          // PLATFORM_ADMIN can invite anyone
          // If role requires institution, institution_id must be provided
          if (
            (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF" || role === "STUDENT") &&
            !finalInstitutionId
          ) {
            errors.push({
              email,
              error: "Institution ID is required for institution-scoped roles",
            });
            continue;
          }
        }

        // Validate institution exists if provided
        if (finalInstitutionId) {
          const institution = await prisma.institution.findUnique({
            where: { institution_id: finalInstitutionId },
          });
          if (!institution || institution.deleted_at) {
            errors.push({ email, error: "Institution not found" });
            continue;
          }
        }

        // Generate secure token (32 bytes = 256 bits)
        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(rawToken).digest("hex");

        // Set expiry to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Store raw token temporarily for email generation
        const { storeToken } = await import("@/lib/invites/token-store");
        storeToken(tokenHash, rawToken, 168); // Store for 7 days

        // Create invite with QUEUED status
        const invite = await prisma.invite.create({
          data: {
            email: email.toLowerCase().trim(),
            role,
            institution_id: finalInstitutionId || null,
            token_hash: tokenHash,
            expires_at: expiresAt,
            created_by_user_id: ctx.userId,
            status: "QUEUED",
            batch_id: finalBatchId,
            max_attempts: parseInt(process.env.INVITE_MAX_ATTEMPTS || "3", 10),
          },
          select: {
            invite_id: true,
            email: true,
            role: true,
            institution_id: true,
            status: true,
            expires_at: true,
            created_at: true,
          },
        });

        processedInvites.push({
          ...invite,
          // Store raw token temporarily (in production, use encrypted storage or token lookup)
          raw_token: rawToken, // This should be stored securely or returned only once
        });
      } catch (error: any) {
        errors.push({
          email: item.email || "unknown",
          error: error.message || "Failed to process invite",
        });
      }
    }

    return ok({
      batch_id: finalBatchId,
      total: invites.length,
      created: processedInvites.length,
      errors: errors.length,
      invites: processedInvites.map((inv) => ({
        ...inv,
        invite_link: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/invite?token=${inv.raw_token}`,
      })),
      error_details: errors,
    });
  } catch (error) {
    return fail(error);
  }
}
