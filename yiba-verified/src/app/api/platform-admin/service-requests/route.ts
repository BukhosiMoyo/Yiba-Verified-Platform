/**
 * GET /api/platform-admin/service-requests
 * List service requests. PLATFORM_ADMIN sees all; ADVISOR sees only requests for their service type(s).
 * Query: ?service_type=... &status=... &limit=... &offset=...
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";
import type { ServiceRequestType, ServiceRequestStatus } from "@prisma/client";

const SERVICE_TYPES: ServiceRequestType[] = [
  "ACCREDITATION_HELP",
  "ACCOUNTING_SERVICES",
  "MARKETING_WEBSITES",
  "GENERAL_INQUIRY",
];
const STATUSES: ServiceRequestStatus[] = ["NEW", "CONTACTED", "CLOSED"];

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!hasCap(ctx.role, "SERVICE_REQUESTS_VIEW")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to view service requests", 403);
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get("service_type")?.trim();
    const status = searchParams.get("status")?.trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    type WhereType = { service_type?: ServiceRequestType | { in: ServiceRequestType[] }; status?: ServiceRequestStatus };
    const where: WhereType = {};
    if (status && STATUSES.includes(status as ServiceRequestStatus)) {
      where.status = status as ServiceRequestStatus;
    }

    // ADVISOR: only show requests for their assigned service type(s)
    if (ctx.role === "ADVISOR") {
      const myTypes = await prisma.userServiceLead.findMany({
        where: { user_id: ctx.userId },
        select: { service_type: true },
      });
      const types = myTypes.map((t) => t.service_type);
      if (types.length === 0) {
        return ok({ items: [], total: 0 });
      }
      where.service_type = types.length === 1 ? types[0]! : { in: types };
      if (serviceType && SERVICE_TYPES.includes(serviceType as ServiceRequestType) && types.includes(serviceType as ServiceRequestType)) {
        where.service_type = serviceType as ServiceRequestType;
      }
    } else {
      if (serviceType && SERVICE_TYPES.includes(serviceType as ServiceRequestType)) {
        where.service_type = serviceType as ServiceRequestType;
      }
    }

    const [items, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          service_type: true,
          full_name: true,
          email: true,
          organization: true,
          phone: true,
          message: true,
          status: true,
          created_at: true,
        },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return ok({ items, total });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/platform-admin/service-requests error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to list service requests", 500));
  }
}
