/**
 * GET /api/platform-admin/users/[userId]/service-leads - List service types assigned to user (ADVISOR)
 * PUT /api/platform-admin/users/[userId]/service-leads - Set service types for ADVISOR (PLATFORM_ADMIN only)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { ServiceRequestType } from "@prisma/client";

const SERVICE_TYPES: ServiceRequestType[] = [
  "ACCREDITATION_HELP",
  "ACCOUNTING_SERVICES",
  "MARKETING_WEBSITES",
  "GENERAL_INQUIRY",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireRole(request, "PLATFORM_ADMIN");
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { user_id: userId, deleted_at: null },
      select: { role: true },
    });
    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }
    if (user.role !== "ADVISOR") {
      return ok({ service_types: [] });
    }

    const leads = await prisma.userServiceLead.findMany({
      where: { user_id: userId },
      select: { service_type: true },
    });
    return ok({ service_types: leads.map((l) => l.service_type) });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/platform-admin/users/[userId]/service-leads error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to get service leads", 500));
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireRole(request, "PLATFORM_ADMIN");
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { user_id: userId, deleted_at: null },
      select: { role: true },
    });
    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }
    if (user.role !== "ADVISOR") {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Service leads can only be set for users with role ADVISOR",
        400
      );
    }

    const body = await request.json();
    const service_types = Array.isArray(body?.service_types) ? body.service_types : [];
    const valid = service_types.filter((t: string) => SERVICE_TYPES.includes(t as ServiceRequestType));
    const unique = [...new Set(valid)] as ServiceRequestType[];

    await prisma.$transaction(async (tx) => {
      await tx.userServiceLead.deleteMany({ where: { user_id: userId } });
      if (unique.length > 0) {
        await tx.userServiceLead.createMany({
          data: unique.map((service_type) => ({ user_id: userId, service_type })),
        });
      }
    });

    const leads = await prisma.userServiceLead.findMany({
      where: { user_id: userId },
      select: { service_type: true },
    });
    return ok({ service_types: leads.map((l) => l.service_type) });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("PUT /api/platform-admin/users/[userId]/service-leads error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to set service leads", 500));
  }
}
