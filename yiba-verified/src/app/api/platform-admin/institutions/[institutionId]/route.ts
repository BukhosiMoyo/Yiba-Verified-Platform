// GET /api/platform-admin/institutions/[institutionId] - Get institution details (PLATFORM_ADMIN only)
//
// Example:
//   curl -sS https://yibaverified.co.za/api/platform-admin/institutions/<ID> | jq

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { calculateInstitutionCompleteness } from "@/lib/completeness";

/**
 * GET /api/platform-admin/institutions/[institutionId]
 * Gets a single institution by ID (PLATFORM_ADMIN only).
 * 
 * RBAC: Only PLATFORM_ADMIN can access this endpoint.
 * 
 * Returns:
 * {
 *   "institution": Institution
 * }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ institutionId: string }> }
) {
  try {
    await requireRole(request, "PLATFORM_ADMIN");
    const { institutionId } = await context.params;

    // Query institution with all related data
    const institution = await prisma.institution.findUnique({
      where: {
        institution_id: institutionId,
        deleted_at: null,
      },
      select: {
        institution_id: true,
        legal_name: true,
        trading_name: true,
        institution_type: true,
        registration_number: true,
        tax_compliance_pin: true,
        physical_address: true,
        postal_address: true,
        province: true,
        delivery_modes: true,
        status: true,
        profile_completeness: true,
        contact_person_name: true,
        contact_email: true,
        contact_number: true,
        created_at: true,
        updated_at: true,
        users: {
          where: { deleted_at: null },
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            role: true,
            status: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
        },
        readinessRecords: {
          where: { deleted_at: null },
          select: {
            readiness_id: true,
            qualification_title: true,
            saqa_id: true,
            nqf_level: true,
            readiness_status: true,
            submission_date: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
        },
        submissions: {
          where: { deleted_at: null },
          select: {
            submission_id: true,
            status: true,
            submitted_at: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
          take: 50, // Limit to recent 50
        },
        qctoRequests: {
          where: { deleted_at: null },
          select: {
            request_id: true,
            status: true,
            request_type: true,
            created_at: true,
            updated_at: true,
          },
          orderBy: { created_at: "desc" },
        },
        _count: {
          select: {
            users: true,
            learners: true,
            enrolments: true,
            submissions: true,
            qctoRequests: true,
            readinessRecords: true,
          },
        },
      },
    });

    if (!institution) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Institution not found",
        404
      );
    }

    const completeness = calculateInstitutionCompleteness(institution as any);

    // Fire-and-forget update if changed
    if (institution.profile_completeness !== completeness.percentage) {
      prisma.institution.update({
        where: { institution_id: institutionId },
        data: { profile_completeness: completeness.percentage },
      }).catch(console.error);
    }

    return ok({ institution: { ...institution, completeness } });
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/platform-admin/institutions/[institutionId]
 * Updates an institution (PLATFORM_ADMIN only).
 * 
 * RBAC: Only PLATFORM_ADMIN can access this endpoint.
 * 
 * Body:
 * {
 *   "legal_name"?: string,
 *   "trading_name"?: string,
 *   "institution_type"?: string,
 *   "registration_number"?: string,
 *   "tax_compliance_pin"?: string,
 *   "physical_address"?: string,
 *   "postal_address"?: string,
 *   "province"?: string,
 *   "contact_person_name"?: string,
 *   "contact_email"?: string,
 *   "contact_number"?: string,
 *   "status"?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"
 * }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ institutionId: string }> }
) {
  try {
    const ctx = await requireRole(request, "PLATFORM_ADMIN");
    const { institutionId } = await context.params;

    const body = await request.json();
    const { ...updateData } = body;

    // Check if institution exists
    const existingInstitution = await prisma.institution.findUnique({
      where: { institution_id: institutionId },
    });

    if (!existingInstitution || existingInstitution.deleted_at) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Institution not found",
        404
      );
    }

    // Validate registration number uniqueness if being updated
    if (updateData.registration_number && updateData.registration_number !== existingInstitution.registration_number) {
      const regExists = await prisma.institution.findFirst({
        where: {
          registration_number: updateData.registration_number,
          deleted_at: null,
          institution_id: { not: institutionId },
        },
      });
      if (regExists) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Registration number already in use",
          400
        );
      }
    }

    // Update institution with audit logging
    const updatedInstitution = await prisma.$transaction(async (tx) => {
      // 1. Fetch current data for audit comparison
      const current = await tx.institution.findUniqueOrThrow({
        where: { institution_id: institutionId },
      });

      // 2. Perform update
      const result = await tx.institution.update({
        where: { institution_id: institutionId },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
          institution_type: true,
          registration_number: true,
          tax_compliance_pin: true,
          physical_address: true,
          postal_address: true,
          province: true,
          delivery_modes: true,
          status: true,
          contact_person_name: true,
          contact_email: true,
          contact_number: true,
          created_at: true,
          updated_at: true,
        },
      });

      // 3. Create audit logs for changed fields
      const { createAuditLogs, serializeValue } = await import("@/services/audit.service");
      const auditEntries: any[] = [];

      // Check each field in updateData
      for (const [key, val] of Object.entries(updateData)) {
        // Skip updated_at as it's handled automatically
        if (key === "updated_at") continue;

        const fieldName = key;
        const newValue = val;
        const oldValue = current[key as keyof typeof current];

        const isDifferent = JSON.stringify(newValue) !== JSON.stringify(oldValue);

        if (isDifferent) {
          auditEntries.push({
            entityType: "INSTITUTION",
            entityId: institutionId,
            fieldName: fieldName,
            oldValue: serializeValue(oldValue),
            newValue: serializeValue(newValue),
            changedBy: ctx.userId,
            roleAtTime: ctx.role,
            changeType: "UPDATE",
            // Since this is an admin action on an institution, link it to that institution
            institutionId: institutionId,
          });
        }
      }

      if (auditEntries.length > 0) {
        await createAuditLogs(tx, auditEntries);
      }

      return result;
    });

    return ok(updatedInstitution);
  } catch (error) {
    return fail(error);
  }
}
