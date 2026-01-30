/**
 * POST /api/institution/institutions
 *
 * Add a new institution (branch/location) for the current user.
 * Only INSTITUTION_ADMIN can add. Creates Institution + UserInstitution (is_primary: false).
 * Same validation as onboarding (legal name, registration number, address, province, branch_code unique).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { PROVINCES } from "@/lib/provinces";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { InstitutionType, DeliveryMode } from "@prisma/client";

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
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only Institution Admins can add a new location",
        403
      );
    }

    let body: InstitutionInput;
    try {
      body = await request.json();
    } catch {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body", 400);
    }

    const inst = body;
    if (!inst?.legal_name?.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Legal name is required", 400);
    }
    if (!inst?.registration_number?.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Registration number is required", 400);
    }
    if (!inst?.physical_address?.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Physical address is required", 400);
    }
    if (!inst?.province?.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Province is required", 400);
    }
    if (!PROVINCES.includes(inst.province as (typeof PROVINCES)[number])) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid province. Must be one of: ${PROVINCES.join(", ")}`,
        400
      );
    }
    const instType = inst.institution_type?.trim();
    if (!instType || !INSTITUTION_TYPES.includes(instType as InstitutionType)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid institution type. Must be one of: ${INSTITUTION_TYPES.join(", ")}`,
        400
      );
    }
    if (inst.branch_code?.trim()) {
      const existing = await prisma.institution.findFirst({
        where: { branch_code: inst.branch_code.trim(), deleted_at: null },
      });
      if (existing) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Branch code "${inst.branch_code}" is already in use. Use a unique code.`,
          400
        );
      }
    }

    const deliveryModes =
      Array.isArray(inst.delivery_modes) && inst.delivery_modes.length > 0
        ? (inst.delivery_modes.filter((m) =>
            DELIVERY_MODES.includes(m as DeliveryMode)
          ) as DeliveryMode[])
        : (["FACE_TO_FACE"] as DeliveryMode[]);

    const result = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          legal_name: inst.legal_name.trim(),
          trading_name: inst.trading_name?.trim() || null,
          institution_type: instType as InstitutionType,
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

      await tx.userInstitution.create({
        data: {
          user_id: ctx.userId,
          institution_id: institution.institution_id,
          role: "ADMIN",
          is_primary: false,
        },
      });

      return institution;
    });

    return NextResponse.json({
      success: true,
      institutionId: result.institution_id,
      institution: {
        institution_id: result.institution_id,
        legal_name: result.legal_name,
        branch_code: result.branch_code,
        registration_number: result.registration_number,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    const message =
      err instanceof Error ? err.message : "Failed to add location";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
