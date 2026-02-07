import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eachDayOfInterval, subDays, format } from 'date-fns';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '30d';
        const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

        const endDate = new Date();
        const startDate = subDays(endDate, days);

        // Fetch all invites in the range (optimization: assuming reasonable volume)
        // For high volume, use raw SQL for aggregation.
        const invites = await prisma.invite.findMany({
            where: {
                created_at: { gte: startDate }
            },
            select: {
                created_at: true, // as proxy for "added to pipeline" or similar?
                sent_at: true,
                opened_at: true,
                status: true
            }
        });

        // Generate date range
        const dates = eachDayOfInterval({ start: startDate, end: endDate });

        const data = dates.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayInvites = invites.filter(i => {
                const d = i.sent_at;
                return d && d >= dayStart && d <= dayEnd;
            });

            const sent = dayInvites.length;
            const opened = dayInvites.filter(i => i.opened_at).length;
            // Response/Click logic deferred, using mocked logic approximation for now or simplistic
            const responses = 0; // simplistic for now

            return {
                date: dateStr,
                sent,
                opened,
                responses
            };
        });

        return NextResponse.json(data);

    } catch (error) {
        console.error("Failed to fetch trends:", error);
        return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
    }
}
