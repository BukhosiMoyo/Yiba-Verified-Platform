import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { mutateWithAudit } from "@/server/mutations/mutate";
import type { DeliveryMode, ReadinessStatus } from "@prisma/client";
import { autoAssignReviewToEligibleReviewers } from "@/lib/reviewAssignments";
import { validateReadinessForSubmission } from "@/lib/readinessCompletion";
import { unstable_cache } from "next/cache";
import { Notifications } from "@/lib/notifications";

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

    // Cache readiness fetch for 2 seconds to reduce database load
    const getCachedReadiness = unstable_cache(
      async (id: string) => {
        return await prisma.readiness.findFirst({
          where: {
            readiness_id: id,
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
                mime_type: true,
                file_size_bytes: true,
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
      },
      ["readiness-get"],
      { revalidate: 2 }
    );

    // Fetch readiness record (cached)
    const readiness = await getCachedReadiness(readinessId);

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
  qualification_registry_id?: string | null;
  qualification_title?: string;
  saqa_id?: string;
  nqf_level?: number;
  curriculum_code?: string;
  credits?: number;
  occupational_category?: string;
  intended_learner_intake?: number;
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
  learning_material_coverage_percentage?: number;
  learning_material_nqf_aligned?: boolean;
  knowledge_components_complete?: boolean;
  practical_components_complete?: boolean;
  learning_material_quality_verified?: boolean;
  knowledge_module_coverage?: number;
  practical_module_coverage?: number;
  curriculum_alignment_confirmed?: boolean;
  // Section 6: LMIS
  lmis_functional?: boolean;
  lmis_popia_compliant?: boolean;
  lmis_data_storage_description?: string;
  lmis_access_control_description?: string;
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

    let body: UpdateReadinessBody;
    try {
      const bodyText = await request.text();
      if (!bodyText || bodyText.trim() === "") {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Request body is empty", 400);
      }
      body = JSON.parse(bodyText);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Failed to parse request body:", error);
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid JSON in request body", 400);
    }

    // Build update data
    const updateData: any = {};
    
    // Qualification Information (Section 2) - immutable after submission
    const isSubmitted = existing.readiness_status === "SUBMITTED" || 
                       existing.readiness_status === "UNDER_REVIEW" ||
                       existing.readiness_status === "RETURNED_FOR_CORRECTION" ||
                       existing.readiness_status === "REVIEWED" ||
                       existing.readiness_status === "RECOMMENDED" ||
                       existing.readiness_status === "REJECTED";
    
    if (!isSubmitted) {
      // Qualification fields can only be updated if not yet submitted
      if (body.qualification_registry_id !== undefined) {
        updateData.qualification_registry_id = body.qualification_registry_id?.trim() || null;
        if (body.qualification_registry_id) {
          const registry = await prisma.qualificationRegistry.findFirst({
            where: { id: body.qualification_registry_id, deleted_at: null, status: "ACTIVE" },
          });
          if (registry) {
            updateData.qualification_title = registry.name;
            updateData.saqa_id = registry.saqa_id ?? existing.saqa_id;
            updateData.curriculum_code = registry.curriculum_code ?? existing.curriculum_code;
            updateData.nqf_level = registry.nqf_level ?? existing.nqf_level;
            updateData.credits = registry.credits ?? existing.credits;
            updateData.occupational_category = registry.occupational_category ?? existing.occupational_category;
          }
        }
      }
      if (body.qualification_title !== undefined) updateData.qualification_title = body.qualification_title;
      if (body.saqa_id !== undefined) updateData.saqa_id = body.saqa_id;
      if (body.nqf_level !== undefined) updateData.nqf_level = body.nqf_level;
      if (body.curriculum_code !== undefined) updateData.curriculum_code = body.curriculum_code;
      if (body.credits !== undefined) updateData.credits = body.credits;
      if (body.occupational_category !== undefined) updateData.occupational_category = body.occupational_category || null;
      if (body.intended_learner_intake !== undefined) updateData.intended_learner_intake = body.intended_learner_intake;
      if (body.delivery_mode !== undefined) updateData.delivery_mode = body.delivery_mode;
    } else {
      // If submitted, reject attempts to change qualification fields
      if (body.qualification_registry_id !== undefined || body.qualification_title !== undefined || body.saqa_id !== undefined ||
          body.curriculum_code !== undefined || body.credits !== undefined ||
          body.occupational_category !== undefined || body.intended_learner_intake !== undefined ||
          body.delivery_mode !== undefined) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Qualification information is immutable after submission. Contact QCTO if changes are needed.",
          400
        );
      }
    }
    
    if (body.readiness_status !== undefined) {
      updateData.readiness_status = body.readiness_status;
      // If submitting, set submission_date
      if (body.readiness_status === "SUBMITTED" && !existing.submission_date) {
        updateData.submission_date = new Date();
      }
    }

    // When transitioning to SUBMITTED: enforce validation and set qualification_snapshot
    if (body.readiness_status === "SUBMITTED" && existing.readiness_status !== "SUBMITTED" && !existing.submission_date) {
      const readinessForValidation = await prisma.readiness.findFirst({
        where: { readiness_id: readinessId },
        include: {
          facilitators: { select: { facilitator_id: true } },
          documents: { select: { document_id: true, document_type: true } },
        },
      });
      if (readinessForValidation) {
        const merged = { ...readinessForValidation, ...updateData } as typeof readinessForValidation;
        const validation = validateReadinessForSubmission(merged);
        if (!validation.can_submit) {
          return NextResponse.json(
            { error: validation.errors?.[0] ?? "Validation failed", errors: validation.errors, warnings: validation.warnings },
            { status: 400 }
          );
        }
        updateData.qualification_snapshot = {
          qualification_title: merged.qualification_title,
          saqa_id: merged.saqa_id,
          nqf_level: merged.nqf_level,
          curriculum_code: merged.curriculum_code,
          credits: merged.credits,
          occupational_category: merged.occupational_category ?? null,
          delivery_mode: merged.delivery_mode,
          intended_learner_intake: merged.intended_learner_intake ?? null,
          qualification_registry_id: merged.qualification_registry_id ?? null,
          captured_at: new Date().toISOString(),
        };
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
    // Section 9: Learning Material (Form 5)
    if (body.learning_material_coverage_percentage !== undefined) updateData.learning_material_coverage_percentage = body.learning_material_coverage_percentage;
    if (body.learning_material_nqf_aligned !== undefined) updateData.learning_material_nqf_aligned = body.learning_material_nqf_aligned;
    if (body.knowledge_components_complete !== undefined) updateData.knowledge_components_complete = body.knowledge_components_complete;
    if (body.practical_components_complete !== undefined) updateData.practical_components_complete = body.practical_components_complete;
    if (body.learning_material_quality_verified !== undefined) updateData.learning_material_quality_verified = body.learning_material_quality_verified;
    // Section 6: Occupational Health & Safety (OHS)
    if (body.fire_extinguisher_available !== undefined) updateData.fire_extinguisher_available = body.fire_extinguisher_available;
    if (body.fire_extinguisher_service_date !== undefined) updateData.fire_extinguisher_service_date = body.fire_extinguisher_service_date ? new Date(body.fire_extinguisher_service_date) : null;
    if (body.emergency_exits_marked !== undefined) updateData.emergency_exits_marked = body.emergency_exits_marked;
    if (body.accessibility_for_disabilities !== undefined) updateData.accessibility_for_disabilities = body.accessibility_for_disabilities;
    if (body.first_aid_kit_available !== undefined) updateData.first_aid_kit_available = body.first_aid_kit_available;
    if (body.ohs_representative_name !== undefined) updateData.ohs_representative_name = body.ohs_representative_name || null;
    // Section 6: LMIS
    if (body.lmis_functional !== undefined) updateData.lmis_functional = body.lmis_functional;
    if (body.lmis_popia_compliant !== undefined) updateData.lmis_popia_compliant = body.lmis_popia_compliant;
    if (body.lmis_data_storage_description !== undefined) updateData.lmis_data_storage_description = body.lmis_data_storage_description || null;
    if (body.lmis_access_control_description !== undefined) updateData.lmis_access_control_description = body.lmis_access_control_description || null;
    // Section 7: LMS & Online Delivery Capability (Hybrid/Blended)
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

    // Calculate completion data if submitting
    if (body.readiness_status === "SUBMITTED" && !existing.submission_date) {
      try {
        const readinessWithRelations = await prisma.readiness.findFirst({
          where: { readiness_id: readinessId },
          include: {
            facilitators: { select: { facilitator_id: true } },
            documents: { select: { document_id: true, document_type: true } },
          },
        });
        if (readinessWithRelations) {
          try {
            const { calculateSectionCompletion } = await import("@/lib/readinessCompletion");
            // Merge updateData into readinessWithRelations for accurate calculation
            const readinessForCalculation = {
              ...readinessWithRelations,
              ...updateData,
            } as typeof readinessWithRelations;
            const completion = calculateSectionCompletion(readinessForCalculation);
            updateData.section_completion_data = Object.fromEntries(
              completion.sections.map((s) => [
                s.section_name,
                {
                  completed: s.completed,
                  required: s.required,
                  missing_fields: s.missing_fields,
                },
              ])
            );
          } catch (importError) {
            // Log import error but don't fail the request
            console.error(`Failed to import or use readinessCompletion for readiness ${readinessId}:`, importError);
          }
        }
      } catch (error) {
        // Log error but don't fail the request - completion calculation is a convenience feature
        console.error(`Failed to calculate section completion for readiness ${readinessId}:`, error);
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      // Return existing record (no changes, so return as-is)
      return NextResponse.json(existing, { status: 200 });
    }

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

    // Auto-assign to eligible reviewers when readiness is submitted and notify them
    if (body.readiness_status === "SUBMITTED" && existing.readiness_status !== "SUBMITTED") {
      try {
        const assignedUserIds = await autoAssignReviewToEligibleReviewers(
          "READINESS",
          readinessId,
          ctx.userId
        );
        const qualificationTitle = updated?.qualification_title ?? existing.qualification_title ?? undefined;
        for (const userId of assignedUserIds) {
          await Notifications.readinessSubmitted(userId, readinessId, qualificationTitle);
        }
      } catch (error) {
        // Log error but don't fail the request - assignment is a convenience feature
        console.error(
          `Failed to auto-assign readiness ${readinessId} to reviewers:`,
          error
        );
      }
    }

    // Invalidate cache after update
    // Note: unstable_cache doesn't have a direct invalidation API, but revalidate: 2 means it will refresh soon
    
    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    // Enhanced error logging for debugging
    console.error("PATCH /api/institutions/readiness/[readinessId] error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      status: (error as any)?.status,
    });
    return fail(error);
  }
}
