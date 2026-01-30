/**
 * POST /api/institution/onboarding/complete
 *
 * Complete Institution Admin onboarding. Accepts optional institutions array.
 * When user has no institution, at least one institution is required.
 * When user already has an institution, institutions array may be empty (acknowledge only).
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { PROVINCES } from "@/lib/provinces";
import type { InstitutionType, DeliveryMode } from "@prisma/client";
import { Notifications } from "@/lib/notifications";

const INSTITUTION_TYPES: InstitutionType[] = [
  "TVET",
  "PRIVATE_SDP",
  "NGO",
  "UNIVERSITY",
  "EMPLOYER",
  "OTHER",
];
const DELIVERY_MODES: DeliveryMode[] = ["FACE_TO_FACE", "BLENDED", "MOBILE"];

type InstitutionInput = {
  legal_name: string;
  trading_name?: string | null;
  institution_type: string;
  registration_number: string;
  branch_code?: string | null;
  physical_address: string;
  postal_address?: string | null;
  province: string;
  contact_person_name?: string | null;
  contact_email?: string | null;
  contact_number?: string | null;
  delivery_modes?: string[];
  offers_workplace_based_learning?: boolean | null;
  offers_web_based_learning?: boolean | null;
};

export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "INSTITUTION_ADMIN") {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only Institution Admins can complete this onboarding",
          403
        )
      );
    }

    const body = await request.json();
    const { institutions: institutionsInput, acknowledged } = body as {
      institutions?: InstitutionInput[];
      acknowledged?: boolean;
    };

    if (!acknowledged) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "You must acknowledge the responsibilities to complete onboarding",
          400
        )
      );
    }

    const hasExistingInstitution = !!ctx.institutionId;
    const institutions = Array.isArray(institutionsInput) ? institutionsInput : [];

    if (!hasExistingInstitution && institutions.length === 0) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "At least one institution is required. Add your institution details to continue.",
          400
        )
      );
    }

    for (let i = 0; i < institutions.length; i++) {
      const inst = institutions[i];
      if (!inst?.legal_name?.trim()) {
        return fail(
          new AppError(ERROR_CODES.VALIDATION_ERROR, `Institution ${i + 1}: Legal name is required`, 400)
        );
      }
      if (!inst?.registration_number?.trim()) {
        return fail(
          new AppError(ERROR_CODES.VALIDATION_ERROR, `Institution ${i + 1}: Registration number is required`, 400)
        );
      }
      if (!inst?.physical_address?.trim()) {
        return fail(
          new AppError(ERROR_CODES.VALIDATION_ERROR, `Institution ${i + 1}: Physical address is required`, 400)
        );
      }
      if (!inst?.province?.trim()) {
        return fail(
          new AppError(ERROR_CODES.VALIDATION_ERROR, `Institution ${i + 1}: Province is required`, 400)
        );
      }
      if (!PROVINCES.includes(inst.province as (typeof PROVINCES)[number])) {
        return fail(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            `Institution ${i + 1}: Invalid province. Must be one of: ${PROVINCES.join(", ")}`,
            400
          )
        );
      }
      const instType = inst.institution_type?.trim();
      if (!instType || !INSTITUTION_TYPES.includes(instType as InstitutionType)) {
        return fail(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            `Institution ${i + 1}: Invalid institution type. Must be one of: ${INSTITUTION_TYPES.join(", ")}`,
            400
          )
        );
      }
      if (inst.branch_code?.trim()) {
        const existing = await prisma.institution.findFirst({
          where: { branch_code: inst.branch_code.trim(), deleted_at: null },
        });
        if (existing) {
          return fail(
            new AppError(
              ERROR_CODES.VALIDATION_ERROR,
              `Institution ${i + 1}: Branch code "${inst.branch_code}" is already in use. Use a unique code.`,
              400
            )
          );
        }
      }
    }

    const deliveryModesDefault: DeliveryMode[] = ["FACE_TO_FACE"];

    const result = await prisma.$transaction(async (tx) => {
      const createdInstitutionIds: string[] = [];

      for (let i = 0; i < institutions.length; i++) {
        const inst = institutions[i]!;
        const deliveryModes =
          Array.isArray(inst.delivery_modes) && inst.delivery_modes.length > 0
            ? (inst.delivery_modes.filter((m) => DELIVERY_MODES.includes(m as DeliveryMode)) as DeliveryMode[])
            : deliveryModesDefault;

        const institution = await tx.institution.create({
          data: {
            legal_name: inst.legal_name.trim(),
            trading_name: inst.trading_name?.trim() || null,
            institution_type: inst.institution_type as InstitutionType,
            registration_number: inst.registration_number.trim(),
            branch_code: inst.branch_code?.trim() || null,
            physical_address: inst.physical_address.trim(),
            postal_address: inst.postal_address?.trim() || null,
            province: inst.province.trim(),
            delivery_modes: deliveryModes,
            status: "DRAFT",
            contact_person_name: inst.contact_person_name?.trim() || null,
            contact_email: inst.contact_email?.trim() || null,
            contact_number: inst.contact_number?.trim() || null,
            offers_workplace_based_learning: inst.offers_workplace_based_learning ?? null,
            offers_web_based_learning: inst.offers_web_based_learning ?? null,
          },
        });
        createdInstitutionIds.push(institution.institution_id);

        await tx.userInstitution.create({
          data: {
            user_id: ctx.userId,
            institution_id: institution.institution_id,
            role: "ADMIN",
            is_primary: i === 0,
          },
        });
      }

      const firstInstitutionId =
        createdInstitutionIds.length > 0
          ? createdInstitutionIds[0]!
          : ctx.institutionId;

      await tx.user.update({
        where: { user_id: ctx.userId },
        data: {
          onboarding_completed: true,
          onboarding_completed_at: new Date(),
          ...(firstInstitutionId ? { institution_id: firstInstitutionId } : {}),
        },
      });

      return { createdInstitutionIds, firstInstitutionId };
    });

    // Notify platform admins when new institution(s) are created
    if (result.createdInstitutionIds.length > 0) {
      const firstId = result.createdInstitutionIds[0]!;
      const institution = await prisma.institution.findUnique({
        where: { institution_id: firstId },
        select: { legal_name: true },
      });
      const platformAdmins = await prisma.user.findMany({
        where: { role: "PLATFORM_ADMIN", deleted_at: null },
        select: { user_id: true },
      });
      for (const admin of platformAdmins) {
        await Notifications.institutionCreated(
          admin.user_id,
          firstId,
          institution?.legal_name ?? undefined
        );
      }
    }

    revalidateTag("onboarding-status", {});

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
      institutionIds: result.createdInstitutionIds,
      firstInstitutionId: result.firstInstitutionId ?? null,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/institution/onboarding/complete error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to complete onboarding", 500)
    );
  }
}
