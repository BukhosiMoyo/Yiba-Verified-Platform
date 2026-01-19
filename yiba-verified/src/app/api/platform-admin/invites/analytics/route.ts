// GET /api/platform-admin/invites/analytics - Get invite analytics

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/platform-admin/invites/analytics
 * Returns analytics data for invites including metrics, charts, and trends.
 * 
 * Query params:
 * - institution_id: Filter by institution
 * - role: Filter by role
 * - start_date: Start date (ISO string)
 * - end_date: End date (ISO string)
 * - status: Filter by status
 * 
 * RBAC: PLATFORM_ADMIN only
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Only PLATFORM_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can view invite analytics",
        403
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get("institution_id");
    const role = searchParams.get("role");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {
      deleted_at: null,
    };

    if (institutionId) {
      where.institution_id = institutionId;
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate);
      }
    }

    // Get total counts by status
    const statusCounts = await prisma.invite.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    // Get total metrics
    const totalInvites = await prisma.invite.count({ where });
    const sentInvites = await prisma.invite.count({
      where: { ...where, status: { in: ["SENT", "DELIVERED", "OPENED", "ACCEPTED"] } },
    });
    const openedInvites = await prisma.invite.count({
      where: { ...where, opened_at: { not: null } },
    });
    const acceptedInvites = await prisma.invite.count({
      where: { ...where, accepted_at: { not: null } },
    });
    const failedInvites = await prisma.invite.count({
      where: { ...where, status: "FAILED" },
    });
    const queuedInvites = await prisma.invite.count({
      where: { ...where, status: "QUEUED" },
    });
    const retryingInvites = await prisma.invite.count({
      where: { ...where, status: "RETRYING" },
    });

    // Calculate rates
    const openRate = sentInvites > 0 ? (openedInvites / sentInvites) * 100 : 0;
    const acceptanceRate = sentInvites > 0 ? (acceptedInvites / sentInvites) * 100 : 0;
    const failureRate = totalInvites > 0 ? (failedInvites / totalInvites) * 100 : 0;

    // Get delivery over time (last 30 days by default)
    const daysBack = 30;
    const deliveryData = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as count
      FROM "Invite"
      WHERE deleted_at IS NULL
        ${institutionId ? prisma.$queryRaw`AND institution_id = ${institutionId}` : prisma.$queryRaw``}
        ${role ? prisma.$queryRaw`AND role = ${role}` : prisma.$queryRaw``}
        AND created_at >= NOW() - INTERVAL '${daysBack} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get open rate over time
    const openRateData = await prisma.$queryRaw<Array<{ date: string; opened: bigint; sent: bigint }>>`
      SELECT 
        DATE(sent_at) as date,
        COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::int as opened,
        COUNT(*)::int as sent
      FROM "Invite"
      WHERE deleted_at IS NULL
        AND sent_at IS NOT NULL
        ${institutionId ? prisma.$queryRaw`AND institution_id = ${institutionId}` : prisma.$queryRaw``}
        ${role ? prisma.$queryRaw`AND role = ${role}` : prisma.$queryRaw``}
        AND sent_at >= NOW() - INTERVAL '${daysBack} days'
      GROUP BY DATE(sent_at)
      ORDER BY date ASC
    `;

    // Get acceptance rate over time
    const acceptanceRateData = await prisma.$queryRaw<Array<{ date: string; accepted: bigint; sent: bigint }>>`
      SELECT 
        DATE(sent_at) as date,
        COUNT(CASE WHEN accepted_at IS NOT NULL THEN 1 END)::int as accepted,
        COUNT(*)::int as sent
      FROM "Invite"
      WHERE deleted_at IS NULL
        AND sent_at IS NOT NULL
        ${institutionId ? prisma.$queryRaw`AND institution_id = ${institutionId}` : prisma.$queryRaw``}
        ${role ? prisma.$queryRaw`AND role = ${role}` : prisma.$queryRaw``}
        AND sent_at >= NOW() - INTERVAL '${daysBack} days'
      GROUP BY DATE(sent_at)
      ORDER BY date ASC
    `;

    // Get failure reasons
    const failureReasons = await prisma.invite.findMany({
      where: {
        ...where,
        status: "FAILED",
        failure_reason: { not: null },
      },
      select: {
        failure_reason: true,
      },
      take: 100,
    });

    const failureReasonCounts: Record<string, number> = {};
    failureReasons.forEach((invite) => {
      if (invite.failure_reason) {
        const reason = invite.failure_reason.substring(0, 100); // Truncate long reasons
        failureReasonCounts[reason] = (failureReasonCounts[reason] || 0) + 1;
      }
    });

    return ok({
      metrics: {
        total: totalInvites,
        queued: queuedInvites,
        sending: await prisma.invite.count({ where: { ...where, status: "SENDING" } }),
        sent: sentInvites,
        delivered: await prisma.invite.count({ where: { ...where, status: "DELIVERED" } }),
        opened: openedInvites,
        accepted: acceptedInvites,
        failed: failedInvites,
        retrying: retryingInvites,
        expired: await prisma.invite.count({
          where: { ...where, status: "EXPIRED" },
        }),
      },
      rates: {
        openRate: Math.round(openRate * 100) / 100,
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100,
      },
      statusCounts: statusCounts.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      charts: {
        deliveryOverTime: deliveryData.map((item) => ({
          date: item.date,
          count: Number(item.count),
        })),
        openRateOverTime: openRateData.map((item) => ({
          date: item.date,
          opened: Number(item.opened),
          sent: Number(item.sent),
          rate: Number(item.sent) > 0
            ? Math.round((Number(item.opened) / Number(item.sent)) * 100 * 100) / 100
            : 0,
        })),
        acceptanceRateOverTime: acceptanceRateData.map((item) => ({
          date: item.date,
          accepted: Number(item.accepted),
          sent: Number(item.sent),
          rate: Number(item.sent) > 0
            ? Math.round((Number(item.accepted) / Number(item.sent)) * 100 * 100) / 100
            : 0,
        })),
      },
      failureReasons: Object.entries(failureReasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    });
  } catch (error) {
    return fail(error);
  }
}
