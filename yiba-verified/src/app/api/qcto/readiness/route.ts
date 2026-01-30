// GET /api/qcto/readiness - List readiness records (QCTO_USER and PLATFORM_ADMIN)
//
// Query params:
//   ?q=string - Search in qualification_title, saqa_id, institution legal_name/trading_name (min 2 chars)
//   ?status=ReadinessStatus - Filter by readiness_status
//   ?province=string - Filter by institution.province
//   ?assignedTo=me|userId - Filter to readiness assigned to current user or specific user (any role)
//   ?assignmentRole=REVIEWER|AUDITOR - When used with assignedTo, filter by assignment role (e.g. "My Assigned Reviews" vs "My Assigned Audits")
//   ?unassigned=true - Filter to SUBMITTED/UNDER_REVIEW with no REVIEWER assigned (Admin/Super Admin only)
//   ?limit=number - Default 50, max 200
//   ?offset=number - For pagination
//
// Returns: { count: number, items: Readiness[] } with assignments summary per item

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";
import { getProvinceFilterForQCTO } from "@/lib/api/qctoAccess";
import { hasCap } from "@/lib/capabilities";
import { getAssignedReadinessIdsForUser } from "@/lib/qctoAssignments";

// QCTO can only see submitted and reviewed records - NOT drafts
// CRITICAL: QCTO must NEVER see NOT_STARTED or IN_PROGRESS records
const VALID_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "RETURNED_FOR_CORRECTION",
  "REVIEWED",
  "RECOMMENDED",
  "REJECTED",
];

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only QCTO and platform administrators can access this endpoint",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const qParam = searchParams.get("q")?.trim() || "";
    const statusParam = searchParams.get("status") || "";
    const provinceParam = searchParams.get("province")?.trim() || "";
    const assignedToParam = searchParams.get("assignedTo")?.trim() || "";
    const assignmentRoleParam = searchParams.get("assignmentRole")?.trim() as "REVIEWER" | "AUDITOR" | "";
    const unassignedParam = searchParams.get("unassigned") === "true";
    const limitRaw = parseInt(searchParams.get("limit") || "50", 10);
    const offsetRaw = parseInt(searchParams.get("offset") || "0", 10);
    const limit = Math.min(Number.isNaN(limitRaw) ? 50 : limitRaw, 200);
    const offset = Math.max(0, Number.isNaN(offsetRaw) ? 0 : offsetRaw);

    // unassigned queue: only Admin/Super Admin
    if (unassignedParam && ctx.role !== "PLATFORM_ADMIN" && !hasCap(ctx.role, "QCTO_ASSIGN")) {
      return Response.json({ count: 0, items: [] }, { status: 200 });
    }

    // CRITICAL: QCTO must NEVER see NOT_STARTED or IN_PROGRESS records
    const where: any = {
      deleted_at: null,
      readiness_status: {
        notIn: ["NOT_STARTED", "IN_PROGRESS"], // QCTO cannot see drafts
      },
    };

    // If user explicitly filters by status, apply it (but only if it's a valid QCTO-visible status)
    if (statusParam && VALID_STATUSES.includes(statusParam)) {
      where.readiness_status = statusParam;
    }

    // Get province filter based on user's assigned provinces
    let provinceFilter: string[] | null;
    try {
      provinceFilter = await getProvinceFilterForQCTO(ctx);
    } catch (e) {
      console.error("[GET /api/qcto/readiness] getProvinceFilterForQCTO failed:", e);
      throw e;
    }

    // Apply province filtering to institution
    if (provinceFilter !== null) {
      // User has assigned provinces - filter institutions to those provinces
      if (provinceFilter.length === 0) {
        // No provinces assigned - return empty result
        return Response.json({ count: 0, items: [] }, { status: 200 });
      }
      where.institution = {
        ...where.institution,
        province: { in: provinceFilter },
      };
    }

    // If user explicitly requested a specific province (and they have access), apply it
    if (provinceParam) {
      if (provinceFilter === null || provinceFilter.includes(provinceParam)) {
        where.institution = {
          ...where.institution,
          province: provinceParam, // Override with specific province
        };
      } else {
        // User requested province they don't have access to - return empty
        return Response.json({ count: 0, items: [] }, { status: 200 });
      }
    }

    if (qParam.length >= 2) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { qualification_title: { contains: qParam, mode: "insensitive" } },
          { saqa_id: { contains: qParam, mode: "insensitive" } },
          { institution: { legal_name: { contains: qParam, mode: "insensitive" } } },
          { institution: { trading_name: { contains: qParam, mode: "insensitive" } } },
        ],
      });
    }

    // Reviewers/auditors (no QCTO_ASSIGN) only see assigned readiness records
    const isReviewerOrAuditorOnly = ctx.role !== "PLATFORM_ADMIN" && !hasCap(ctx.role, "QCTO_ASSIGN");
    if (isReviewerOrAuditorOnly && !unassignedParam) {
      const assignedIds = await getAssignedReadinessIdsForUser(ctx.userId);
      if (assignedIds.length === 0) {
        return Response.json({ count: 0, items: [] }, { status: 200 });
      }
      where.readiness_id = { in: assignedIds };
    }

    // assignedTo=me | userId: filter to readiness assigned to that user (any role, or assignmentRole if set). Ignored when unassigned=true.
    if (assignedToParam && !unassignedParam && !isReviewerOrAuditorOnly) {
      const targetUserId = assignedToParam === "me" ? ctx.userId : assignedToParam;
      if (assignedToParam === "me" || ctx.role === "PLATFORM_ADMIN" || hasCap(ctx.role, "QCTO_ASSIGN")) {
        const assignedRows = await prisma.reviewAssignment.findMany({
          where: {
            review_type: "READINESS",
            assigned_to: targetUserId,
            status: { not: "CANCELLED" },
            ...(assignmentRoleParam === "REVIEWER" || assignmentRoleParam === "AUDITOR"
              ? { assignment_role: assignmentRoleParam }
              : {}),
          },
          select: { review_id: true },
          distinct: ["review_id"],
        });
        const ids = assignedRows.map((a) => a.review_id);
        if (ids.length === 0) {
          return Response.json({ count: 0, items: [] }, { status: 200 });
        }
        where.readiness_id = { in: ids };
      }
    }

    // unassigned=true: SUBMITTED or UNDER_REVIEW with no active REVIEWER assignment
    if (unassignedParam) {
      where.readiness_status = { in: ["SUBMITTED", "UNDER_REVIEW"] };
      const assignedRows = await prisma.reviewAssignment.findMany({
        where: {
          review_type: "READINESS",
          assignment_role: "REVIEWER",
          status: { not: "CANCELLED" },
        },
        select: { review_id: true },
        distinct: ["review_id"],
      });
      const assignedIds = assignedRows.map((a) => a.review_id);
      if (assignedIds.length > 0) {
        where.readiness_id = { notIn: assignedIds };
      }
    }

    const [rawItems, count] = await Promise.all([
      prisma.readiness.findMany({
        where,
        include: {
          institution: {
            select: {
              institution_id: true,
              legal_name: true,
              trading_name: true,
              province: true,
            },
          },
          qualification_registry: {
            select: { id: true, name: true, saqa_id: true, curriculum_code: true, nqf_level: true },
          },
          recommendation: {
            select: {
              recommendation_id: true,
              recommendation: true,
              remarks: true,
              created_at: true,
            },
          },
          _count: { select: { documents: true } },
        },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.readiness.count({ where }),
    ]);

    // Assignment summary per readiness (primary reviewer, optional auditor)
    const readinessIds = rawItems.map((i) => i.readiness_id);
    const assignmentsByReadiness =
      readinessIds.length > 0
        ? await prisma.reviewAssignment.findMany({
            where: {
              review_type: "READINESS",
              review_id: { in: readinessIds },
              status: { not: "CANCELLED" },
            },
            include: {
              reviewer: {
                select: {
                  user_id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  role: true,
                },
              },
            },
            orderBy: { assigned_at: "desc" },
          })
        : [];

    const byReviewId: Record<
      string,
      Array<{ assignment_role: string; reviewer: { user_id: string; first_name: string; last_name: string; email: string; role: string } }>
    > = {};
    for (const a of assignmentsByReadiness) {
      if (!byReviewId[a.review_id]) byReviewId[a.review_id] = [];
      byReviewId[a.review_id].push({
        assignment_role: a.assignment_role,
        reviewer: a.reviewer,
      });
    }

    const items = rawItems.map((r) => {
      const assignments = byReviewId[r.readiness_id] ?? [];
      const primaryReviewer = assignments.find((a) => a.assignment_role === "REVIEWER")?.reviewer ?? null;
      const auditor = assignments.find((a) => a.assignment_role === "AUDITOR")?.reviewer ?? null;
      return {
        ...r,
        assignments: {
          primaryReviewer: primaryReviewer
            ? {
                user_id: primaryReviewer.user_id,
                first_name: primaryReviewer.first_name,
                last_name: primaryReviewer.last_name,
                email: primaryReviewer.email,
                role: primaryReviewer.role,
              }
            : null,
          auditor: auditor
            ? {
                user_id: auditor.user_id,
                first_name: auditor.first_name,
                last_name: auditor.last_name,
                email: auditor.email,
                role: auditor.role,
              }
            : null,
        },
      };
    });

    return Response.json({ count, items }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/qcto/readiness] Error:", error);
    if (error instanceof Error) console.error("[GET /api/qcto/readiness] Stack:", error.stack);
    return fail(error);
  }
}
