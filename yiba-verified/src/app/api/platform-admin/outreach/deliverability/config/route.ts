import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CONFIG_KEY = 'OUTREACH_BATCH_CONFIG';
const DEFAULT_CONFIG = {
    batch_size: 50,
    schedule_start_hour: 8,
    schedule_end_hour: 17,
    jitter_enabled: true,
    jitter_max_minutes: 15
};

export async function GET() {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: CONFIG_KEY }
        });

        if (!setting) {
            return NextResponse.json(DEFAULT_CONFIG);
        }

        return NextResponse.json(JSON.parse(setting.value));
    } catch (error) {
        console.error("Failed to fetch batch config:", error);
        return NextResponse.json(DEFAULT_CONFIG);
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        // Validate body schema here if needed

        await prisma.systemSetting.upsert({
            where: { key: CONFIG_KEY },
            update: {
                value: JSON.stringify(body),
                updated_by: session.user.userId
            },
            create: {
                key: CONFIG_KEY,
                value: JSON.stringify(body),
                updated_by: session.user.userId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update batch config:", error);
        return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
    }
}
