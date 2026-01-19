// POST /api/invites/accept - Accept an invite and create user account

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

/**
 * POST /api/invites/accept
 * Accepts an invite and creates a user account.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token || !name || !password) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Token, name, and password are required",
        400
      );
    }

    // Validate password
    if (password.length < 8) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Password must be at least 8 characters",
        400
      );
    }

    // Hash the token to look it up
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Find invite
    const invite = await prisma.invite.findUnique({
      where: {
        token_hash: tokenHash,
        deleted_at: null,
      },
    });

    if (!invite) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Invalid invite token",
        404
      );
    }

    // Check if already used
    if (invite.used_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "This invite has already been used",
        400
      );
    }

    // Check if expired
    if (new Date() > invite.expires_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "This invite has expired",
        400
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existingUser && !existingUser.deleted_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "User with this email already exists",
        400
      );
    }

    // Parse name (assume "First Last" format)
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    if (!firstName) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Name must include at least a first name",
        400
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: invite.email.toLowerCase().trim(),
          first_name: firstName,
          last_name: lastName,
          password_hash: passwordHash,
          role: invite.role,
          institution_id: invite.institution_id,
          status: "ACTIVE",
        },
      });

      // If STUDENT role, optionally create Learner record
      // (This depends on your domain logic - for now we'll skip it as it requires more data)

      // Mark invite as used and accepted
      await tx.invite.update({
        where: { invite_id: invite.invite_id },
        data: {
          used_at: new Date(),
          accepted_at: new Date(),
          status: "ACCEPTED",
        },
      });

      return user;
    });

    return ok({
      success: true,
      user: {
        user_id: result.user_id,
        email: result.email,
        role: result.role,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
