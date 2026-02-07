import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EngagementState, InviteStatus } from '@prisma/client';

export async function GET() {
    try {
        const [
            totalSent,
            delivered, // Assuming sent = delivered for now (or status delivered if we track it)
            opened,
            clicked,
            responses, // ENGAGED+
            signups, // ACCEPTED
            declines // DECLINED
        ] = await Promise.all([
            prisma.invite.count({ where: { engagement_state: { not: 'UNCONTACTED' } } }),
            prisma.invite.count({ where: { status: 'DELIVERED' } }), // Or delivered_at != null
            prisma.invite.count({ where: { opened_at: { not: null } } }),
            prisma.invite.count({ where: { clicked_at: { not: null } } }),
            prisma.invite.count({
                where: {
                    engagement_state: { in: ['ENGAGED', 'EVALUATING', 'READY', 'ACTIVE'] }
                }
            }),
            prisma.invite.count({ where: { status: 'ACCEPTED' } }), // Or accepted_at != null
            prisma.invite.count({ where: { engagement_state: 'DECLINED' } }),
        ]);

        const conversion_rate = totalSent > 0 ? ((signups / totalSent) * 100).toFixed(1) : 0;

        // Avg time to signup (mock calculation or complex query)
        // For now, return 0 or calculate if feasible.
        // Let's count delivered as sent for now if delivered is 0 (since we might not have tracking yet)
        const effectiveDelivered = delivered === 0 ? totalSent : delivered;

        return NextResponse.json({
            sent: totalSent,
            delivered: effectiveDelivered,
            opened,
            clicked,
            responses,
            signups,
            declines,
            conversion_rate: Number(conversion_rate),
            avg_time_to_signup_hours: 0 // Placeholder until we have data
        });
    } catch (error) {
        console.error("Failed to fetch metrics:", error);
        return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
    }
}
