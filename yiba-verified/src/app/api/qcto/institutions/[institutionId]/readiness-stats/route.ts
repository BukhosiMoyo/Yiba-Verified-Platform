import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";

interface RouteParams {
  params: Promise<{
    institutionId: string;
  }>;
}

/**
 * GET /api/qcto/institutions/[institutionId]/readiness-stats
 * 
 * Returns readiness statistics for an institution (QCTO only).
 * Used for Institution Profile Snapshot component.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { institutionId } = await params;

    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can access this endpoint", 403));
    }

    // Fetch institution
    const institution = await prisma.institution.findFirst({
      where: {
        institution_id: institutionId,
        deleted_at: null,
      },
      select: {
        institution_id: true,
        legal_name: true,
        trading_name: true,
        status: true,
        created_at: true,
      },
    });

    if (!institution) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Institution not found", 404));
    }

    // Calculate years active
    const yearsActive = Math.floor(
      (new Date().getTime() - new Date(institution.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)
    );

    // Fetch readiness records (excluding drafts - QCTO visibility rule)
    const allReadiness = await prisma.readiness.findMany({
      where: {
        institution_id: institutionId,
        deleted_at: null,
        readiness_status: {
          notIn: ["NOT_STARTED", "IN_PROGRESS"], // QCTO cannot see drafts
        },
      },
      select: {
        readiness_status: true,
        recommendation: {
          select: {
            recommendation: true,
          },
        },
      },
    });

    // Calculate statistics
    const previousSubmissions = allReadiness.length;
    const approved = allReadiness.filter(
      (r) => r.readiness_status === "RECOMMENDED" || r.recommendation?.recommendation === "RECOMMENDED"
    ).length;
    const rejected = allReadiness.filter(
      (r) => r.readiness_status === "REJECTED" || r.recommendation?.recommendation === "NOT_RECOMMENDED"
    ).length;

    // Get approved qualifications (recommended readiness records)
    const approvedQualifications = await prisma.readiness.findMany({
      where: {
        institution_id: institutionId,
        deleted_at: null,
        readiness_status: "RECOMMENDED",
      },
      select: {
        readiness_id: true,
        qualification_title: true,
        saqa_id: true,
        nqf_level: true,
      },
      orderBy: { created_at: "desc" },
      take: 10, // Limit to most recent 10
    });

    return NextResponse.json({
      institution: {
        institution_id: institution.institution_id,
        name: institution.trading_name || institution.legal_name,
        legal_name: institution.legal_name,
        trading_name: institution.trading_name,
        status: institution.status,
      },
      years_active: yearsActive,
      previous_submissions_count: previousSubmissions,
      approved_count: approved,
      rejected_count: rejected,
      approved_qualifications: approvedQualifications,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("GET /api/qcto/institutions/[institutionId]/readiness-stats error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch institution readiness stats", 500));
  }
}
