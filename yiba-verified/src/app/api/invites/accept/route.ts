// POST /api/invites/accept - Accept an invite (new user: create account; existing user: link institution)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { validateProvinceAssignment } from "@/lib/security/validation";
import { getServerSession } from "@/lib/get-server-session";
import { Notifications } from "@/lib/notifications";

/**
 * POST /api/invites/accept
 * - With token + name + password: create new user and mark invite accepted.
 * - With token only (and session): existing user — link institution/role and mark invite accepted (session email must match invite email).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, name, password, email } = body;

    if (!token || typeof token !== "string") {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Token is required",
        400
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

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

    if (invite.used_at || invite.accepted_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "This invite has already been used",
        400
      );
    }

    if (invite.declined_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "This invite was declined",
        400
      );
    }

    if (new Date() > invite.expires_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "This invite has expired",
        400
      );
    }

    // Determine target email: provided email OR invite email
    const targetEmail = (email || invite.email).toLowerCase().trim();

    // Validate email format if changed
    if (email && email.toLowerCase() !== invite.email.toLowerCase()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid email format", 400);
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: targetEmail, deleted_at: null },
      select: { user_id: true, institution_id: true, role: true },
    });

    // Existing user path: token only, require session email === targetEmail
    if (existingUser && (!name || !password)) {
      const session = await getServerSession();
      const sessionEmail = (session?.user?.email as string)?.toLowerCase?.();

      if (!sessionEmail || sessionEmail !== targetEmail) {
        throw new AppError(
          ERROR_CODES.UNAUTHENTICATED,
          `Sign in with ${targetEmail} to accept this invitation`,
          401
        );
      }

      const now = new Date();
      await prisma.$transaction(async (tx) => {
        await tx.invite.update({
          where: { invite_id: invite.invite_id },
          data: {
            used_at: now,
            accepted_at: now,
            status: "ACCEPTED",
            accepted_email: targetEmail !== invite.email.toLowerCase() ? targetEmail : null
          },
        });

        if (invite.institution_id) {
          const uiRole = invite.role === "INSTITUTION_ADMIN" ? "ADMIN" : "STAFF";
          await tx.userInstitution.upsert({
            where: {
              user_id_institution_id: {
                user_id: existingUser.user_id,
                institution_id: invite.institution_id,
              },
            },
            create: {
              user_id: existingUser.user_id,
              institution_id: invite.institution_id,
              role: uiRole,
              is_primary: !existingUser.institution_id,
            },
            update: {},
          });
          if (!existingUser.institution_id) {
            await tx.user.update({
              where: { user_id: existingUser.user_id },
              data: { institution_id: invite.institution_id },
            });
          }
        }
      });

      // Notify institution admins that invite was accepted (one row per recipient)
      if (invite.institution_id) {
        const admins = await prisma.userInstitution.findMany({
          where: { institution_id: invite.institution_id, role: "ADMIN" },
          select: { user_id: true },
        });
        for (const { user_id } of admins) {
          await Notifications.inviteAccepted(user_id, invite.institution_id, invite.email);
        }
      }

      return ok({
        success: true,
        existingUser: true,
        user: {
          user_id: existingUser.user_id,
          email: targetEmail,
          role: existingUser.role,
        },
      });
    }

    // New user path: require name and password
    if (!existingUser && (!name || !password)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Name and password are required to create your account",
        400
      );
    }

    if (existingUser && (name || password)) {
      // If user changed email to one that exists -> error
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `User with email ${targetEmail} already exists — sign in to accept`,
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

    // Use province from invite if available, otherwise from body (for QCTO roles)
    const defaultProvince = invite.default_province || body.default_province || null;
    const assignedProvinces = body.assigned_provinces || (defaultProvince ? [defaultProvince] : []);

    // Validate province assignment based on role
    validateProvinceAssignment(invite.role, defaultProvince, assignedProvinces);

    // Platform admins are auto-verified with BLACK badge
    const isPlatformAdmin = invite.role === "PLATFORM_ADMIN";

    // Create user in a transaction
    // Institution admin may have invite.institution_id null — they add institution(s) during onboarding; no UserInstitution row here
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: targetEmail,
          first_name: firstName,
          last_name: lastName,
          password_hash: passwordHash,
          role: invite.role,
          institution_id: invite.institution_id, // null for INSTITUTION_ADMIN without institution; they add during onboarding
          status: "ACTIVE",
          onboarding_completed: false, // Students and institution admins without institution must complete onboarding
          default_province: defaultProvince,
          assigned_provinces: assignedProvinces,
          // Auto-verify platform admins with BLACK badge
          ...(isPlatformAdmin && {
            verification_level: "BLACK",
            verification_date: new Date(),
          }),
        },
      });

      // If STUDENT role, create OnboardingProgress record for tracking
      if (invite.role === "STUDENT") {
        await tx.onboardingProgress.create({
          data: {
            user_id: user.user_id,
            current_step: 1,
          },
        });
      }

      // Mark invite as used and accepted
      await tx.invite.update({
        where: { invite_id: invite.invite_id },
        data: {
          used_at: new Date(),
          accepted_at: new Date(),
          status: "ACCEPTED",
          accepted_email: targetEmail !== invite.email.toLowerCase() ? targetEmail : null
        },
      });

      return user;
    });

    // Notify institution admins that invite was accepted (one row per recipient)
    if (invite.institution_id) {
      const admins = await prisma.userInstitution.findMany({
        where: { institution_id: invite.institution_id, role: "ADMIN" },
        select: { user_id: true },
      });
      for (const { user_id } of admins) {
        await Notifications.inviteAccepted(user_id, invite.institution_id, invite.email);
      }
    }

    return ok({
      success: true,
      existingUser: false,
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
