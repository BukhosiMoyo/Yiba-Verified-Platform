// GET /api/qcto/facilitators - List facilitators accessible to QCTO
//
// Security rules:
// - QCTO_USER: can list facilitators from APPROVED submissions/requests
// - PLATFORM_ADMIN: can list all facilitators
//
// Query parameters:
// - institution_id: Filter by institution
// - readiness_id: Filter by readiness record
// - search: Search by name, ID number, qualifications
// - limit, offset: Pagination
//
// Returns:
// {
//   "items": [ ...facilitators... ],
//   "count": number,
//   "meta": { ... }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { canAccessQctoData } from "@/lib/rbac";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getProvinceFilterForQCTO } from "@/lib/api/qctoAccess";

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot list facilitators`,
        403
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get("institution_id");
    const readinessId = searchParams.get("readiness_id");
    const verificationStatus = searchParams.get("verification_status");
    const certificationStatus = searchParams.get("certification_status"); // "VALID", "EXPIRED", "EXPIRING_SOON", "NONE"
    const search = searchParams.get("search") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Get province filter for QCTO users
    const provinceFilter = await getProvinceFilterForQCTO(ctx);

    // Build where clause
    const where: any = {};

    if (institutionId) {
      where.readiness = {
        institution_id: institutionId,
      };
    }

    if (readinessId) {
      where.readiness_id = readinessId;
    }

    if (verificationStatus) {
      where.verification_status = verificationStatus;
    }

    // Note: Certification status filtering will be done post-query
    // since we need to check expiry dates which requires fetching certifications first

    if (search.trim().length >= 2) {
      where.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { id_number: { contains: search, mode: "insensitive" } },
        { qualifications: { contains: search, mode: "insensitive" } },
      ];
    }

    // For QCTO_USER, filter by accessible readiness records
    if (ctx.role === "QCTO_USER") {
      // Get accessible readiness IDs from APPROVED submissions/requests
      const [submissionResources, requestResources] = await Promise.all([
        prisma.submissionResource.findMany({
          where: {
            resource_type: { in: ["READINESS", "FACILITATOR"] },
            submission: {
              status: { in: ["APPROVED", "SUBMITTED", "UNDER_REVIEW"] },
              deleted_at: null,
            },
          },
          select: {
            resource_id_value: true,
            resource_type: true,
          },
        }),
        prisma.qCTORequestResource.findMany({
          where: {
            resource_type: { in: ["READINESS", "FACILITATOR"] },
            request: {
              status: "APPROVED",
              deleted_at: null,
            },
          },
          select: {
            resource_id_value: true,
            resource_type: true,
          },
        }),
      ]);

      // Separate readiness IDs and facilitator IDs from submissions
      const readinessIdsFromSubmissions = submissionResources
        .filter((r) => r.resource_type === "READINESS" && r.resource_id_value)
        .map((r) => r.resource_id_value);
      
      const facilitatorIdsFromSubmissions = submissionResources
        .filter((r) => r.resource_type === "FACILITATOR" && r.resource_id_value)
        .map((r) => r.resource_id_value);

      // Get facilitator IDs from requests
      const facilitatorIdsFromRequests = requestResources
        .filter((r) => r.resource_type === "FACILITATOR" && r.resource_id_value)
        .map((r) => r.resource_id_value);
      
      const readinessIdsFromRequests = requestResources
        .filter((r) => r.resource_type === "READINESS" && r.resource_id_value)
        .map((r) => r.resource_id_value);

      // Get all facilitator IDs to look up their readiness_id
      const allFacilitatorIds = [
        ...facilitatorIdsFromSubmissions,
        ...facilitatorIdsFromRequests,
      ].filter((id, index, self) => self.indexOf(id) === index);

      // Get readiness IDs from facilitators
      const facilitatorsFromResources = allFacilitatorIds.length > 0
        ? await prisma.facilitator.findMany({
            where: {
              facilitator_id: { in: allFacilitatorIds },
            },
            select: {
              readiness_id: true,
            },
          })
        : [];

      const readinessIdsFromFacilitators = facilitatorsFromResources.map((f) => f.readiness_id);

      // Combine all accessible readiness IDs
      const allReadinessIds = [
        ...readinessIdsFromSubmissions,
        ...readinessIdsFromRequests,
        ...readinessIdsFromFacilitators,
      ].filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

      if (allReadinessIds.length === 0) {
        // No accessible readiness records - return empty
        return NextResponse.json({
          items: [],
          count: 0,
          meta: { isYourRequestsOnly: false },
        });
      }

      where.readiness_id = { in: allReadinessIds };
    }

    // Apply province filtering if needed
    if (provinceFilter !== null && provinceFilter.length > 0) {
      where.readiness = {
        ...where.readiness,
        institution: {
          province: { in: provinceFilter },
        },
      };
    }

    // Fetch facilitators
    const [facilitators, total] = await Promise.all([
      prisma.facilitator.findMany({
        where,
        include: {
          readiness: {
            include: {
              institution: {
                select: {
                  institution_id: true,
                  legal_name: true,
                  trading_name: true,
                  province: true,
                },
              },
            },
          },
          documents: {
            select: {
              document_id: true,
              document_type: true,
              file_name: true,
              status: true,
            },
          },
          certifications: {
            orderBy: { expiry_date: "asc" },
          },
          moduleCompletions: {
            select: {
              completion_id: true,
              enrolment_id: true,
            },
          },
        },
        orderBy: [
          { last_name: "asc" },
          { first_name: "asc" },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.facilitator.count({ where }),
    ]);

    // Filter by certification status if specified
    let filteredFacilitators = facilitators;
    if (certificationStatus) {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      filteredFacilitators = facilitators.filter((f) => {
        const certs = f.certifications || [];
        
        if (certificationStatus === "NONE") {
          return certs.length === 0;
        }
        
        if (certificationStatus === "VALID") {
          return certs.some((c: any) => {
            if (!c.expiry_date) return true; // No expiry = always valid
            return new Date(c.expiry_date) > now;
          });
        }
        
        if (certificationStatus === "EXPIRED") {
          return certs.some((c: any) => {
            if (!c.expiry_date) return false;
            return new Date(c.expiry_date) <= now;
          });
        }
        
        if (certificationStatus === "EXPIRING_SOON") {
          return certs.some((c: any) => {
            if (!c.expiry_date) return false;
            const expiry = new Date(c.expiry_date);
            return expiry > now && expiry <= thirtyDaysFromNow;
          });
        }
        
        return true;
      });
    }

    return NextResponse.json({
      items: filteredFacilitators,
      count: certificationStatus ? filteredFacilitators.length : total,
      meta: {
        limit,
        offset,
        hasMore: offset + limit < (certificationStatus ? filteredFacilitators.length : total),
      },
    });
  } catch (error: any) {
    console.error("GET /api/qcto/facilitators error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Failed to fetch facilitators" },
      { status: 500 }
    );
  }
}
