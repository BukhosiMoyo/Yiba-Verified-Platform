import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { ctx } = await requireAuth(req as any);
    
    // Only platform admin needs badge counts
    if (ctx.role !== "PLATFORM_ADMIN" || ctx.impersonationSessionId) {
      return NextResponse.json({ invites: 0, announcements: 0, errors: 0 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [pendingInvitesCount, activeAnnouncementsCount, recentErrorsCount] = await Promise.all([
      prisma.invite.count({
        where: {
          deleted_at: null,
          status: { in: ["QUEUED", "SENDING", "SENT"] },
          expires_at: { gt: now },
        },
      }),
      prisma.announcement.count({
        where: {
          status: "ACTIVE",
          deleted_at: null,
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        },
      }),
      prisma.clientErrorReport
        .count({ where: { created_at: { gte: oneDayAgo } } })
        .catch(() => 0),
    ]);

    return NextResponse.json({
      invites: pendingInvitesCount,
      announcements: activeAnnouncementsCount,
      errors: recentErrorsCount,
    });
  } catch (error) {
    console.error("Error fetching badge counts:", error);
    return NextResponse.json({ invites: 0, announcements: 0, errors: 0 }, { status: 500 });
  }
}
