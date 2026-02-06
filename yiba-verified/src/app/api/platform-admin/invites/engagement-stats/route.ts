import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EngagementState, Prisma } from "@prisma/client";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user.role !== "PLATFORM_ADMIN" && session.user.role !== "QCTO_SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch engagement metrics
        const [
            totalInvites,
            stateDistribution,
            avgScore,
            scoreDistribution,
            recentTransitions,
            dailyTrends
        ] = await Promise.all([
            // Total invites
            prisma.invite.count(),

            // State distribution
            prisma.invite.groupBy({
                by: ['engagement_state'],
                _count: true,
            }),

            // Average engagement score
            prisma.invite.aggregate({
                _avg: {
                    engagement_score_raw: true,
                },
            }),

            // Score distribution (manual bucketing)
            prisma.$queryRaw<Array<{ bucket: string; count: bigint }>>`
        SELECT 
          CASE 
            WHEN engagement_score_raw BETWEEN 0 AND 20 THEN '0-20'
            WHEN engagement_score_raw BETWEEN 21 AND 40 THEN '21-40'
            WHEN engagement_score_raw BETWEEN 41 AND 60 THEN '41-60'
            WHEN engagement_score_raw BETWEEN 61 AND 80 THEN '61-80'
            WHEN engagement_score_raw BETWEEN 81 AND 100 THEN '81-100'
            ELSE '100+'
          END as bucket,
          COUNT(*) as count
        FROM "Invite"
        GROUP BY bucket
        ORDER BY bucket
      `,

            // Recent state transitions (from engagement_history JSON)
            prisma.invite.findMany({
                where: {
                    engagement_history: { not: Prisma.JsonNull },
                },
                select: {
                    invite_id: true,
                    email: true,
                    engagement_state: true,
                    engagement_score_raw: true,
                    engagement_history: true,
                    last_interaction_at: true,
                },
                orderBy: {
                    last_interaction_at: 'desc',
                },
                take: 20,
            }),

            // Daily trends (last 30 days)
            prisma.$queryRaw<Array<{ date: Date; contacted: bigint; engaged: bigint; active: bigint }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE engagement_state = 'CONTACTED') as contacted,
          COUNT(*) FILTER (WHERE engagement_state = 'ENGAGED') as engaged,
          COUNT(*) FILTER (WHERE engagement_state = 'ACTIVE') as active
        FROM "Invite"
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
        ]);

        // Calculate funnel metrics
        const stateCounts = stateDistribution.reduce((acc, item) => {
            acc[item.engagement_state || 'UNCONTACTED'] = item._count;
            return acc;
        }, {} as Record<string, number>);

        const funnel = {
            uncontacted: stateCounts.UNCONTACTED || 0,
            contacted: stateCounts.CONTACTED || 0,
            engaged: stateCounts.ENGAGED || 0,
            evaluating: stateCounts.EVALUATING || 0,
            ready: stateCounts.READY || 0,
            active: stateCounts.ACTIVE || 0,
        };

        // Calculate conversion rates
        const conversionRates = {
            contactedToEngaged: funnel.contacted > 0 ? (funnel.engaged / funnel.contacted) * 100 : 0,
            engagedToReady: funnel.engaged > 0 ? (funnel.ready / funnel.engaged) * 100 : 0,
            readyToActive: funnel.ready > 0 ? (funnel.active / funnel.ready) * 100 : 0,
        };

        // Summary metrics
        const engaged = (stateCounts.ENGAGED || 0) + (stateCounts.EVALUATING || 0) + (stateCounts.READY || 0);
        const dormant = stateCounts.DORMANT || 0;
        const activeRate = funnel.contacted > 0 ? (funnel.active / funnel.contacted) * 100 : 0;

        // Format recent transitions
        const transitions = recentTransitions.map(invite => {
            const history = invite.engagement_history as any[];
            const lastTransition = history && history.length > 0 ? history[history.length - 1] : null;

            return {
                inviteId: invite.invite_id,
                email: invite.email,
                currentState: invite.engagement_state,
                score: invite.engagement_score_raw,
                lastTransition: lastTransition ? {
                    from: lastTransition.fromState,
                    to: lastTransition.toState,
                    timestamp: lastTransition.timestamp,
                    reason: lastTransition.reason,
                } : null,
            };
        });

        return NextResponse.json({
            summary: {
                totalInvites,
                totalEngaged: engaged,
                avgScore: Math.round(avgScore._avg.engagement_score_raw || 0),
                activeRate: Math.round(activeRate),
                dormantCount: dormant,
            },
            funnel,
            conversionRates,
            stateDistribution: stateDistribution.map(item => ({
                state: item.engagement_state,
                count: item._count,
            })),
            scoreDistribution: scoreDistribution.map(item => ({
                bucket: item.bucket,
                count: Number(item.count),
            })),
            recentTransitions: transitions,
            dailyTrends: dailyTrends.map(item => ({
                date: item.date,
                contacted: Number(item.contacted),
                engaged: Number(item.engaged),
                active: Number(item.active),
            })),
        });

    } catch (error) {
        console.error("Engagement stats fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch engagement stats" }, { status: 500 });
    }
}
