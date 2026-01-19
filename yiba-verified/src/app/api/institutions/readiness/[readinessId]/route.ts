import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { mutateWithAudit } from "@/server/mutations/mutate";
import type { DeliveryMode, ReadinessStatus } from "@prisma/client";

/**
 * GET /api/institutions/readiness/[readinessId]
 * 
 * Fetches a single readiness record by ID.
 * 
 * Access Control:
 * - INSTITUTION_* roles: Can view their institution's readiness records
 * - PLATFORM_ADMIN: Can view any readiness record
 * - Other roles: 403 Forbidden
 * 
 * Returns: Readiness
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ readinessId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId } = await params;

    // RBAC: Institution roles and PLATFORM_ADMIN can view
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to view readiness records", 403);
    }

    // Fetch readiness record
    const readiness = await prisma.readiness.findFirst({
      where: {
        readiness_id: readinessId,
        deleted_at: null,
      },
      include: {
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
        documents: {
          orderBy: { uploaded_at: "desc" },
          select: {
            document_id: true,
            file_name: true,
            file_type: true,
            file_size: true,
            uploaded_at: true,
            uploaded_by: true,
            related_entity: true,
            related_entity_id: true,
          },
        },
        recommendation: {
          include: {
            recommendedByUser: {
              select: {
                user_id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    if (!readiness) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Readiness record not found", 404);
    }

    // Institution scoping (for INSTITUTION_* roles)
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (readiness.institution_id !== ctx.institutionId) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "Access denied: Readiness record belongs to another institution", 403);
      }
    }
    // PLATFORM_ADMIN can view any

    return NextResponse.json(readiness, { status: 200 });
  } catch (error: any) {
    return fail(error);
  }
}

interface UpdateReadinessBody {
  qualification_title?: string;
  saqa_id?: string;
  nqf_level?: number;
  curriculum_code?: string;
  delivery_mode?: DeliveryMode;
  readiness_status?: ReadinessStatus;
  // Section 2: Self-Assessment
  self_assessment_completed?: boolean;
  self_assessment_remarks?: string;
  // Section 3: Registration & Legal Compliance
  registration_type?: string;
  professional_body_registration?: boolean;
  // Section 4: Infrastructure & Physical Resources
  training_site_address?: string;
  ownership_type?: string;
  number_of_training_rooms?: number;
  room_capacity?: number;
  facilitator_learner_ratio?: string;
  // Section 5: Learning Material Alignment
  learning_material_exists?: boolean;
  knowledge_module_coverage?: number;
  practical_module_coverage?: number;
  curriculum_alignment_confirmed?: boolean;
  // Section 6: Occupational Health & Safety (OHS)
  fire_extinguisher_available?: boolean;
  fire_extinguisher_service_date?: string;
  emergency_exits_marked?: boolean;
  accessibility_for_disabilities?: boolean;
  first_aid_kit_available?: boolean;
  ohs_representative_name?: string;
  // Section 7: LMS & Online Delivery Capability
  lms_name?: string;
  max_learner_capacity?: number;
  internet_connectivity_method?: string;
  isp?: string;
  backup_frequency?: string;
  data_storage_description?: string;
  security_measures_description?: string;
  // Section 8: Workplace-Based Learning (WBL)
  wbl_workplace_partner_name?: string;
  wbl_agreement_type?: string;
  wbl_agreement_duration?: string;
  wbl_components_covered?: string;
  wbl_learner_support_description?: string;
  wbl_assessment_responsibility?: string;
  // Section 9: Policies & Procedures
  policies_procedures_notes?: string;
  // Section 10: Human Resources (Facilitators)
  facilitators_notes?: string;
}

/**
 * PATCH /api/institutions/readiness/[readinessId]
 * 
 * Updates a readiness record.
 * 
 * Access Control:
 * - INSTITUTION_* roles: Can update their institution's readiness records (only if NOT_STARTED or IN_PROGRESS)
 * - PLATFORM_ADMIN: Can update any readiness record
 * - Other roles: 403 Forbidden
 * 
 * Request Body:
 * {
 *   qualification_title?: string,
 *   saqa_id?: string,
 *   nqf_level?: number,
 *   curriculum_code?: string,
 *   delivery_mode?: DeliveryMode,
 *   readiness_status?: ReadinessStatus
 * }
 * 
 * Returns: Updated Readiness
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ readinessId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId } = await params;

    // RBAC: Institution roles and PLATFORM_ADMIN can update
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to update readiness records", 403);
    }

    // Fetch existing readiness record
    const existing = await prisma.readiness.findFirst({
      where: {
        readiness_id: readinessId,
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Readiness record not found", 404);
    }

    // Institution scoping (for INSTITUTION_* roles)
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (existing.institution_id !== ctx.institutionId) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "Access denied: Readiness record belongs to another institution", 403);
      }
      // Institution users can only update if not yet submitted
      if (existing.readiness_status !== "NOT_STARTED" && existing.readiness_status !== "IN_PROGRESS") {
        throw new AppError(ERROR_CODES.FORBIDDEN, "Cannot update readiness record: Status is not NOT_STARTED or IN_PROGRESS", 403);
      }
    }
    // PLATFORM_ADMIN can update any

    const body: UpdateReadinessBody = await request.json();

    // Build update data
    const updateData: any = {};
    if (body.qualification_title !== undefined) updateData.qualification_title = body.qualification_title;
    if (body.saqa_id !== undefined) updateData.saqa_id = body.saqa_id;
    if (body.nqf_level !== undefined) updateData.nqf_level = body.nqf_level;
    if (body.curriculum_code !== undefined) updateData.curriculum_code = body.curriculum_code;
    if (body.delivery_mode !== undefined) updateData.delivery_mode = body.delivery_mode;
    if (body.readiness_status !== undefined) {
      updateData.readiness_status = body.readiness_status;
      // If submitting, set submission_date
      if (body.readiness_status === "SUBMITTED" && !existing.submission_date) {
        updateData.submission_date = new Date();
      }
    }
    // Section 2: Self-Assessment
    if (body.self_assessment_completed !== undefined) updateData.self_assessment_completed = body.self_assessment_completed;
    if (body.self_assessment_remarks !== undefined) updateData.self_assessment_remarks = body.self_assessment_remarks || null;
    // Section 3: Registration & Legal Compliance
    if (body.registration_type !== undefined) updateData.registration_type = body.registration_type || null;
    if (body.professional_body_registration !== undefined) updateData.professional_body_registration = body.professional_body_registration;
    // Section 4: Infrastructure & Physical Resources
    if (body.training_site_address !== undefined) updateData.training_site_address = body.training_site_address || null;
    if (body.ownership_type !== undefined) updateData.ownership_type = body.ownership_type || null;
    if (body.number_of_training_rooms !== undefined) updateData.number_of_training_rooms = body.number_of_training_rooms || null;
    if (body.room_capacity !== undefined) updateData.room_capacity = body.room_capacity || null;
    if (body.facilitator_learner_ratio !== undefined) updateData.facilitator_learner_ratio = body.facilitator_learner_ratio || null;
    // Section 5: Learning Material Alignment
    if (body.learning_material_exists !== undefined) updateData.learning_material_exists = body.learning_material_exists;
    if (body.knowledge_module_coverage !== undefined) updateData.knowledge_module_coverage = body.knowledge_module_coverage || null;
    if (body.practical_module_coverage !== undefined) updateData.practical_module_coverage = body.practical_module_coverage || null;
    if (body.curriculum_alignment_confirmed !== undefined) updateData.curriculum_alignment_confirmed = body.curriculum_alignment_confirmed;
    // Section 6: Occupational Health & Safety (OHS)
    if (body.fire_extinguisher_available !== undefined) updateData.fire_extinguisher_available = body.fire_extinguisher_available;
    if (body.fire_extinguisher_service_date !== undefined) updateData.fire_extinguisher_service_date = body.fire_extinguisher_service_date ? new Date(body.fire_extinguisher_service_date) : null;
    if (body.emergency_exits_marked !== undefined) updateData.emergency_exits_marked = body.emergency_exits_marked;
    if (body.accessibility_for_disabilities !== undefined) updateData.accessibility_for_disabilities = body.accessibility_for_disabilities;
    if (body.first_aid_kit_available !== undefined) updateData.first_aid_kit_available = body.first_aid_kit_available;
    if (body.ohs_representative_name !== undefined) updateData.ohs_representative_name = body.ohs_representative_name || null;
    // Section 7: LMS & Online Delivery Capability
    if (body.lms_name !== undefined) updateData.lms_name = body.lms_name || null;
    if (body.max_learner_capacity !== undefined) updateData.max_learner_capacity = body.max_learner_capacity || null;
    if (body.internet_connectivity_method !== undefined) updateData.internet_connectivity_method = body.internet_connectivity_method || null;
    if (body.isp !== undefined) updateData.isp = body.isp || null;
    if (body.backup_frequency !== undefined) updateData.backup_frequency = body.backup_frequency || null;
    if (body.data_storage_description !== undefined) updateData.data_storage_description = body.data_storage_description || null;
    if (body.security_measures_description !== undefined) updateData.security_measures_description = body.security_measures_description || null;
    // Section 8: Workplace-Based Learning (WBL)
    if (body.wbl_workplace_partner_name !== undefined) updateData.wbl_workplace_partner_name = body.wbl_workplace_partner_name || null;
    if (body.wbl_agreement_type !== undefined) updateData.wbl_agreement_type = body.wbl_agreement_type || null;
    if (body.wbl_agreement_duration !== undefined) updateData.wbl_agreement_duration = body.wbl_agreement_duration || null;
    if (body.wbl_components_covered !== undefined) updateData.wbl_components_covered = body.wbl_components_covered || null;
    if (body.wbl_learner_support_description !== undefined) updateData.wbl_learner_support_description = body.wbl_learner_support_description || null;
    if (body.wbl_assessment_responsibility !== undefined) updateData.wbl_assessment_responsibility = body.wbl_assessment_responsibility || null;
    // Section 9: Policies & Procedures
    if (body.policies_procedures_notes !== undefined) updateData.policies_procedures_notes = body.policies_procedures_notes || null;
    // Section 10: Human Resources (Facilitators)
    if (body.facilitators_notes !== undefined) updateData.facilitators_notes = body.facilitators_notes || null;

    // Update readiness record
    const updated = await mutateWithAudit({
      entityType: "READINESS",
      entityId: readinessId,
      changeType: "UPDATE",
      fieldName: Object.keys(updateData)[0] || "readiness_id",
      oldValue: existing,
      newValue: updateData,
      institutionId: existing.institution_id,
      reason: `Update readiness record: ${existing.qualification_title} (SAQA ID: ${existing.saqa_id})${body.readiness_status ? ` - Status: ${body.readiness_status}` : ""}`,
      assertCan: async (tx, ctx) => {
        // Already checked above
      },
      mutation: async (tx, ctx) => {
        return await tx.readiness.update({
          where: { readiness_id: readinessId },
          data: updateData,
        });
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return fail(error);
  }
}
