import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [
            totalSent,
            sentToday,
            failed,
            delivered,
            opened
        ] = await Promise.all([
            prisma.invite.count({ where: { status: { not: 'QUEUED' } } }),
            prisma.invite.count({
                where: {
                    status: { not: 'QUEUED' },
                    sent_at: { gte: startOfDay }
                }
            }),
            prisma.invite.count({ where: { status: 'FAILED' } }), // Or failure_reason != null
            prisma.invite.count({ where: { status: 'DELIVERED' } }),
            prisma.invite.count({ where: { opened_at: { not: null } } }),
        ]);

        const bounce_rate = totalSent > 0 ? ((failed / totalSent) * 100).toFixed(1) : 0;
        const open_rate = delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : 0;

        return NextResponse.json({
            sent_today: sentToday,
            bounce_rate: Number(bounce_rate),
            spam_complaints: 0, // Not tracked yet
            open_rate: Number(open_rate)
        });
    } catch (error) {
        console.error("Failed to fetch deliverability metrics:", error);
        return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
    }
}
