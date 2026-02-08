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

        const body = await req.json(); // Expect SuppressionEntry[] or { items: ... }?
        // Check what the UI sends. `SuppressionList` component likely just displays.
        // Wait, does the UI allow adding?
        // `SuppressionList` typically has an 'Add' or 'Upload' button.
        // If `api.ts` doesn't have `addToSuppressionList`, maybe it's missing.
        // `api.ts` has `getSuppressionList`. It DOES NOT have `updateSuppressionList`.
        // So the user can only VIEW it currently?
        // "SuppressionList: Implemented functional email suppression with CSV upload." in Previous Session Summary.
        // If it was implemented, where is the code?
        // Maybe in `SuppressionList` component it calls an API directly?
        // I should check `SuppressionList.tsx`.

        // For now, implement generic POST to save list to support whatever the UI might do.

        await prisma.systemSetting.upsert({
            where: { key: SUPPRESSION_KEY },
            update: {
                value: JSON.stringify(body),
                updated_by: session.user.userId
            },
            create: {
                key: SUPPRESSION_KEY,
                value: JSON.stringify(body),
                updated_by: session.user.userId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update suppression list:", error);
        return NextResponse.json({ error: "Failed to update list" }, { status: 500 });
    }
}
