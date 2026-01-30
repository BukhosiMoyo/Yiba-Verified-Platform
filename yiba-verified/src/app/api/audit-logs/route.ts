import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";
import type { AuditEntityType, AuditChangeType } from "@prisma/client";

/**
 * GET /api/audit-logs
 * 
 * Fetches audit logs with filtering and pagination.
 * 
 * Access Control:
 * - PLATFORM_ADMIN: Can view all audit logs
 * - QCTO_USER: Can view all audit logs (AUDIT_VIEW)
 * - Other roles: 403 Forbidden
 * 
 * Query Parameters:
 * - entity_type: Filter by entity type (LEARNER, ENROLMENT, SUBMISSION, etc.)
 * - entity_id: Filter by specific entity ID
 * - change_type: Filter by change type (CREATE, UPDATE, DELETE, STATUS_CHANGE)
 * - institution_id: Filter by institution ID
 * - changed_by: Filter by user ID who made the change
 * - start_date: Filter logs from this date (ISO string)
 * - end_date: Filter logs until this date (ISO string)
 * - limit: Number of results (default: 50, max: 200)
 * - offset: Pagination offset (default: 0)
 * 
 * Returns: { count: number, items: AuditLog[] }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and get context
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can view audit logs", 403);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entity_type") as AuditEntityType | null;
    const entityId = searchParams.get("entity_id") || null;
    const changeType = searchParams.get("change_type") as AuditChangeType | null;
    const institutionId = searchParams.get("institution_id") || null;
    const changedBy = searchParams.get("changed_by") || null;
    const startDate = searchParams.get("start_date") || null;
    const endDate = searchParams.get("end_date") || null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {};

    if (entityType) {
      where.entity_type = entityType;
    }

    if (entityId) {
      where.entity_id = entityId;
    }

    if (changeType) {
      where.change_type = changeType;
    }

    if (institutionId) {
      where.institution_id = institutionId;
    }

    if (changedBy) {
      where.changed_by = changedBy;
    }

    if (startDate || endDate) {
      where.changed_at = {};
      if (startDate) {
        where.changed_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.changed_at.lte = new Date(endDate);
      }
    }

    // Fetch audit logs with related data
    const [items, count] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          changedBy: {
            select: {
              user_id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          institution: {
            select: {
              institution_id: true,
              legal_name: true,
              trading_name: true,
            },
          },
          relatedSubmission: {
            select: {
              submission_id: true,
              title: true,
              status: true,
            },
          },
          relatedQCTORequest: {
            select: {
              request_id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: {
          changed_at: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // For institution_id fields, resolve old and new values to institution names
    const itemsWithResolvedInstitutions = await Promise.all(
      items.map(async (log) => {
        if (log.field_name === "institution_id") {
          let oldInstitution = null;
          let newInstitution = null;

          // Parse old_value and new_value to get institution IDs
          try {
            const oldValue = log.old_value ? JSON.parse(log.old_value) : null;
            const newValue = log.new_value ? JSON.parse(log.new_value) : null;

            if (oldValue && typeof oldValue === "string") {
              oldInstitution = await prisma.institution.findUnique({
                where: { institution_id: oldValue },
                select: {
                  institution_id: true,
                  legal_name: true,
                  trading_name: true,
                },
              });
            }

            if (newValue && typeof newValue === "string") {
              newInstitution = await prisma.institution.findUnique({
                where: { institution_id: newValue },
                select: {
                  institution_id: true,
                  legal_name: true,
                  trading_name: true,
                },
              });
            }
          } catch (e) {
            // If parsing fails, values might be plain strings
            if (log.old_value && !log.old_value.startsWith("{")) {
              oldInstitution = await prisma.institution.findUnique({
                where: { institution_id: log.old_value },
                select: {
                  institution_id: true,
                  legal_name: true,
                  trading_name: true,
                },
              });
            }
            if (log.new_value && !log.new_value.startsWith("{")) {
              newInstitution = await prisma.institution.findUnique({
                where: { institution_id: log.new_value },
                select: {
                  institution_id: true,
                  legal_name: true,
                  trading_name: true,
                },
              });
            }
          }

          return {
            ...log,
            oldInstitution,
            newInstitution,
          };
        }
        return log;
      })
    );

    // Format response (convert Prisma field names to camelCase)
    const formattedItems = itemsWithResolvedInstitutions.map((log: any) => ({
      audit_id: log.audit_id,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      field_name: log.field_name,
      old_value: log.old_value,
      new_value: log.new_value,
      changed_by: log.changed_by,
      changed_by_user: log.changedBy
        ? {
            user_id: log.changedBy.user_id,
            email: log.changedBy.email,
            first_name: log.changedBy.first_name,
            last_name: log.changedBy.last_name,
          }
        : null,
      role_at_time: log.role_at_time,
      changed_at: log.changed_at.toISOString(),
      reason: log.reason,
      institution_id: log.institution_id,
      institution: log.institution
        ? {
            institution_id: log.institution.institution_id,
            legal_name: log.institution.legal_name,
            trading_name: log.institution.trading_name,
          }
        : null,
      oldInstitution: log.oldInstitution
        ? {
            institution_id: log.oldInstitution.institution_id,
            legal_name: log.oldInstitution.legal_name,
            trading_name: log.oldInstitution.trading_name,
          }
        : null,
      newInstitution: log.newInstitution
        ? {
            institution_id: log.newInstitution.institution_id,
            legal_name: log.newInstitution.legal_name,
            trading_name: log.newInstitution.trading_name,
          }
        : null,
      change_type: log.change_type,
      related_submission_id: log.related_submission_id,
      related_submission: log.relatedSubmission
        ? {
            submission_id: log.relatedSubmission.submission_id,
            title: log.relatedSubmission.title,
            status: log.relatedSubmission.status,
          }
        : null,
      related_qcto_request_id: log.related_qcto_request_id,
      related_qcto_request: log.relatedQCTORequest
        ? {
            request_id: log.relatedQCTORequest.request_id,
            title: log.relatedQCTORequest.title,
            status: log.relatedQCTORequest.status,
          }
        : null,
    }));

    return NextResponse.json(
      {
        count,
        items: formattedItems,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return fail(error);
  }
}
