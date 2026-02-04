// GET /api/platform-admin/qualifications/[qualificationId] - Single qualification with extra details (PLATFORM_ADMIN only)
// PATCH /api/platform-admin/qualifications/[qualificationId] - Update qualification

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qualificationId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { qualificationId } = await params;

    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can view qualification details",
        403
      );
    }

    const qualification = await prisma.qualification.findFirst({
      where: { qualification_id: qualificationId, deleted_at: null },
      include: {
        _count: { select: { enrolments: true } },
        enrolments: {
          take: 20,
          orderBy: { created_at: "desc" },
          select: {
            enrolment_id: true,
            qualification_title: true,
            enrolment_status: true,
            start_date: true,
            created_at: true,
            institution_id: true,
            institution: { select: { legal_name: true, trading_name: true } },
            learner_id: true,
            learner: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });

    if (!qualification) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Qualification not found", 404);
    }

    return ok(qualification);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ qualificationId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { qualificationId } = await params;

    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can update qualifications",
        403
      );
    }

    const body = await request.json();
    const {
      name, code, type, nqf_level, status, summary,
      study_mode, duration_value, duration_unit,
      credits, regulatory_body, seta, entry_requirements, assessment_type,
      workplace_required, workplace_hours, language_of_delivery, career_outcomes, modules,
      saqa_id, curriculum_code
    } = body;

    // Validation for partial updates
    if (name && (typeof name !== "string" || name.trim().length === 0)) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Name cannot be empty", 400);
    }
    if (code && (typeof code !== "string" || code.trim().length === 0)) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Code cannot be empty", 400);
    }

    // Check for duplicates if code or SAQA ID is changing
    if (code || saqa_id) {
      const existing = await prisma.qualification.findFirst({
        where: {
          OR: [
            code ? { code: { equals: code.trim(), mode: "insensitive" } } : {},
            saqa_id ? { saqa_id: { equals: saqa_id.trim() } } : {},
          ],
          qualification_id: { not: qualificationId }, // Exclude self
          deleted_at: null,
        },
      });

      if (existing) {
        if (code && existing.code.toLowerCase() === code.trim().toLowerCase()) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "A qualification with this code already exists", 409);
        }
        if (saqa_id && existing.saqa_id === saqa_id.trim()) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "A qualification with this SAQA ID already exists", 409);
        }
      }
    }

    const updatedQualification = await mutateWithAudit({
      ctx,
      entityType: "QUALIFICATION",
      changeType: "UPDATE",
      entityId: qualificationId,
      fieldName: "qualification_id", // Using ID as the reference field
      assertCan: async () => { },
      mutation: async (tx) => {
        return tx.qualification.update({
          where: { qualification_id: qualificationId },
          data: {
            // Only include fields if they are defined in body (undefined means no change, null is valid update for optionals)
            ...(name !== undefined && { name: name.trim() }),
            ...(code !== undefined && { code: code.trim().toUpperCase() }),
            ...(type !== undefined && { type }),
            ...(nqf_level !== undefined && { nqf_level }),
            ...(status !== undefined && { status }),
            ...(summary !== undefined && { summary }),
            ...(study_mode !== undefined && { study_mode }),
            ...(duration_value !== undefined && { duration_value }),
            ...(duration_unit !== undefined && { duration_unit }),
            ...(credits !== undefined && { credits }),
            ...(regulatory_body !== undefined && { regulatory_body }),
            ...(seta !== undefined && { seta }),
            ...(entry_requirements !== undefined && { entry_requirements }),
            ...(assessment_type !== undefined && { assessment_type }),
            ...(workplace_required !== undefined && { workplace_required }),
            ...(workplace_hours !== undefined && { workplace_hours }),
            ...(language_of_delivery !== undefined && { language_of_delivery }),
            ...(career_outcomes !== undefined && { career_outcomes }),
            ...(modules !== undefined && { modules }),
            ...(saqa_id !== undefined && { saqa_id: saqa_id ? saqa_id.trim() : null }),
            ...(curriculum_code !== undefined && { curriculum_code: curriculum_code ? curriculum_code.trim() : null }),
          }
        });
      }
    });

    return ok(updatedQualification);
  } catch (error) {
    return fail(error);
  }
}
