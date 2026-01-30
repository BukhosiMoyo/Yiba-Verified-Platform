/**
 * GET /api/platform-admin/service-requests/[id] - Get one service request
 * PATCH /api/platform-admin/service-requests/[id] - Update status (CONTACTED, CLOSED)
 * PLATFORM_ADMIN: any request. ADVISOR: only requests for their service type(s).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";
import type { ServiceRequestStatus } from "@prisma/client";

const STATUSES: ServiceRequestStatus[] = ["NEW", "CONTACTED", "CLOSED"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!hasCap(ctx.role, "SERVICE_REQUESTS_VIEW")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to view service requests", 403);
    }

    const { id } = await params;
    const req = await prisma.serviceRequest.findUnique({
      where: { id },
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
        updated_at: true,
      },
    });

    if (!req) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Service request not found", 404);
    }

    if (ctx.role === "ADVISOR") {
      const assigned = await prisma.userServiceLead.findFirst({
        where: { user_id: ctx.userId, service_type: req.service_type },
      });
      if (!assigned) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "You do not have access to this service request", 403);
      }
    }

    return ok(req);
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/platform-admin/service-requests/[id] error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to get service request", 500));
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!hasCap(ctx.role, "SERVICE_REQUESTS_EDIT")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to edit service requests", 403);
    }

    const { id } = await params;
    const existing = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { id: true, service_type: true },
    });

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Service request not found", 404);
    }

    if (ctx.role === "ADVISOR") {
      const assigned = await prisma.userServiceLead.findFirst({
        where: { user_id: ctx.userId, service_type: existing.service_type },
      });
      if (!assigned) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "You do not have access to this service request", 403);
      }
    }

    const body = await request.json();
    const status = typeof body?.status === "string" ? body.status.trim() : "";
    if (!status || !STATUSES.includes(status as ServiceRequestStatus)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `status must be one of: ${STATUSES.join(", ")}`,
        400
      );
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: { status: status as ServiceRequestStatus },
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
        updated_at: true,
      },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("PATCH /api/platform-admin/service-requests/[id] error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to update service request", 500));
  }
}
