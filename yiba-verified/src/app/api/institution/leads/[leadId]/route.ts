/**
 * GET /api/institution/leads/[leadId] - Get one lead (same institution)
 * PATCH /api/institution/leads/[leadId] - Update lead status (NEW, CONTACTED, CLOSED)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!ctx.institutionId) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "User is not associated with an institution", 403));
    }
    const canView =
      ctx.role === "PLATFORM_ADMIN" ||
      ctx.role === "INSTITUTION_ADMIN" ||
      (ctx.role === "INSTITUTION_STAFF" && hasCap(ctx.role, "CAN_VIEW_LEADS"));
    if (!canView) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to view leads", 403));
    }

    const { leadId } = await params;
    const lead = await prisma.institutionLead.findFirst({
      where: { id: leadId, institution_id: ctx.institutionId },
    });
    if (!lead) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Lead not found", 404));
    }
    return Response.json(lead);
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/institution/leads/[leadId] error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to load lead", 500));
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!ctx.institutionId) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "User is not associated with an institution", 403));
    }
    const canView =
      ctx.role === "PLATFORM_ADMIN" ||
      ctx.role === "INSTITUTION_ADMIN" ||
      (ctx.role === "INSTITUTION_STAFF" && hasCap(ctx.role, "CAN_VIEW_LEADS"));
    if (!canView) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to update leads", 403));
    }

    const { leadId } = await params;
    const lead = await prisma.institutionLead.findFirst({
      where: { id: leadId, institution_id: ctx.institutionId },
    });
    if (!lead) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Lead not found", 404));
    }

    const body = await request.json();
    const status = body?.status;
    if (!status || !["NEW", "CONTACTED", "CLOSED"].includes(status)) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Valid status is required (NEW, CONTACTED, CLOSED)", 400));
    }

    const updated = await prisma.institutionLead.update({
      where: { id: leadId },
      data: { status: status as "NEW" | "CONTACTED" | "CLOSED" },
    });
    return Response.json(updated);
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("PATCH /api/institution/leads/[leadId] error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to update lead", 500));
  }
}
