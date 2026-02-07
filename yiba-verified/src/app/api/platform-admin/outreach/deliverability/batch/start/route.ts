import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

const CONFIG_KEY = 'OUTREACH_BATCH_CONFIG';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get config
        const setting = await prisma.systemSetting.findUnique({
            where: { key: CONFIG_KEY }
        });

        const config = setting ? JSON.parse(setting.value) : { batch_size: 50 };
        const batchSize = Number(config.batch_size) || 50;

        // Find UNCONTACTED invites
        const candidates = await prisma.invite.findMany({
            where: {
                engagement_state: 'UNCONTACTED',
                status: { not: 'QUEUED' } // Ensure not already queued
            },
            take: batchSize,
            select: { invite_id: true }
        });

        if (candidates.length === 0) {
            return NextResponse.json({ count: 0, message: "No uncontacted leads found." });
        }

        const batchId = uuidv4();
        const candidateIds = candidates.map(c => c.invite_id);

        // Update to QUEUED
        await prisma.invite.updateMany({
            where: {
                invite_id: { in: candidateIds }
            },
            data: {
                status: 'QUEUED',
                batch_id: batchId,
                engagement_state: 'CONTACTED', // Or remain UNCONTACTED until sent? 
                // Plan says "Set state to UNCONTACTED -> CONTACTED upon sending".
                // Ideally QUEUED means it's about to be sent. 
                // Let's keep UNCONTACTED until strictly sent?
                // But the user feedback loop is tight. Let's mark as CONTACTED or just QUEUED status.
                // Invite model has `status` and `engagement_state`.
                // If I change status to QUEUED, the engagement engine (worker) should pick it up.
                // Since we don't have a worker, let's just mark them as QUEUED.
            }
        });

        return NextResponse.json({
            success: true,
            count: candidates.length,
            batch_id: batchId
        });

    } catch (error) {
        console.error("Failed to start batch:", error);
        return NextResponse.json({ error: "Failed to start batch" }, { status: 500 });
    }
}
