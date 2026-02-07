import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Alert } from '@/lib/outreach/types';
import { subHours } from 'date-fns';

export async function GET() {
    try {
        const alerts: Alert[] = [];

        // 1. Check Deliverability / Bounce Rate
        const failedCount = await prisma.invite.count({ where: { status: 'FAILED' } });
        const totalSent = await prisma.invite.count({ where: { status: { not: 'QUEUED' } } });

        if (totalSent > 50) {
            const bounceRate = failedCount / totalSent;
            if (bounceRate > 0.1) {
                alerts.push({
                    alert_id: 'high-bounce-rate',
                    type: 'BOUNCE_RATE',
                    severity: 'HIGH',
                    message: `Bounce rate is ${(bounceRate * 100).toFixed(1)}%, exceeding the 10% threshold.`,
                    timestamp: new Date(),
                    acknowledged: false
                });
            }
        }

        // 2. Check Queue Health
        const queuedCount = await prisma.invite.count({ where: { status: 'QUEUED' } });
        if (queuedCount > 1000) {
            alerts.push({
                alert_id: 'large-queue',
                type: 'QUEUE_ISSUE',
                severity: 'MEDIUM',
                message: `${queuedCount} emails are queued for delivery.`,
                timestamp: new Date(),
                acknowledged: false
            });
        }

        // 3. Check for recently stalled pipeline?
        // (If no emails sent in 24h but we have UNCONTACTED leads)
        const lastSent = await prisma.invite.findFirst({
            where: { sent_at: { not: null } },
            orderBy: { sent_at: 'desc' }
        });

        const uncontactedCount = await prisma.invite.count({ where: { engagement_state: 'UNCONTACTED' } });

        if (uncontactedCount > 0 && (!lastSent || lastSent.sent_at! < subHours(new Date(), 24))) {
            alerts.push({
                alert_id: 'stalled-pipeline',
                type: 'QUEUE_ISSUE', // Closest type
                severity: 'LOW',
                message: `No emails sent in 24h despite ${uncontactedCount} uncontacted leads.`,
                timestamp: new Date(),
                acknowledged: false
            });
        }

        return NextResponse.json(alerts);

    } catch (error) {
        console.error("Failed to fetch alerts:", error);
        return NextResponse.json([], { status: 500 });
    }
}
