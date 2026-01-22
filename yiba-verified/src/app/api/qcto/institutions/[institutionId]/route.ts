// GET /api/qcto/institutions/[institutionId] - Get institution details (QCTO_USER and PLATFORM_ADMIN, read-only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";

/**
 * GET /api/qcto/institutions/[institutionId]
 * Gets a single institution by ID. QCTO_USER and PLATFORM_ADMIN can access (read-only).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ institutionId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { institutionId } = await params;

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only QCTO and platform administrators can access this endpoint",
        403
      );
    }

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
        contact_person_name: true,
        contact_email: true,
        contact_number: true,
        created_at: true,
        updated_at: true,
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
          take: 50,
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

    return ok({ institution });
  } catch (error) {
    return fail(error);
  }
}
