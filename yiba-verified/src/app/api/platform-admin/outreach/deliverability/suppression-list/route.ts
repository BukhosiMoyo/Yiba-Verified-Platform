import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const SUPPRESSION_KEY = 'OUTREACH_SUPPRESSION_LIST';

export async function GET() {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: SUPPRESSION_KEY }
        });

        if (!setting) {
            return NextResponse.json([]);
        }

        return NextResponse.json(JSON.parse(setting.value));
    } catch (error) {
        console.error("Failed to fetch suppression list:", error);
        return NextResponse.json([]);
    }
}

// Note: This endpoint might be used to add/remove entries. Current UI sends the full list? 
// Or suppression list component might add one by one.
// Let's assume the UI might send updates. 
// If the UI component `SuppressionList` just uploads a CSV, we might need a different handler.
// But usually suppression is managed via API.
// Let's support POSTing the full list or handling updates if we inspect the body.
// For now, let's assume simple full update or append logic if complex.
// The `api.ts` `getSuppressionList` returns `SuppressionEntry[]`.
// Use `SystemSetting` to store the array.

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { email } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const setting = await prisma.systemSetting.findUnique({ where: { key: SUPPRESSION_KEY } });
        let list: any[] = setting ? JSON.parse(setting.value) : [];

        // Avoid duplicates
        if (!list.find((e: any) => e.email === email)) {
            list.push({
                email,
                reason: "Manual addition",
                added_at: new Date(),
                added_by: session.user.userId
            });
        }

        await prisma.systemSetting.upsert({
            where: { key: SUPPRESSION_KEY },
            update: {
                value: JSON.stringify(list),
                updated_by: session.user.userId
            },
            create: {
                key: SUPPRESSION_KEY,
                value: JSON.stringify(list),
                updated_by: session.user.userId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to add to suppression list:", error);
        return NextResponse.json({ error: "Failed to update list" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const setting = await prisma.systemSetting.findUnique({ where: { key: SUPPRESSION_KEY } });
        if (!setting) return NextResponse.json({ success: true }); // Already empty

        let list: any[] = JSON.parse(setting.value);
        list = list.filter((e: any) => e.email !== email);

        await prisma.systemSetting.update({
            where: { key: SUPPRESSION_KEY },
            data: {
                value: JSON.stringify(list),
                updated_by: session.user.userId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to remove from suppression list:", error);
        return NextResponse.json({ error: "Failed to update list" }, { status: 500 });
    }
}
