import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CampaignService } from "@/lib/campaigns";
import { prisma } from "@/lib/prisma"; // Added import

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user.role !== "PLATFORM_ADMIN" && session.user.role !== "QCTO_SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { recipients } = body;

        if (!Array.isArray(recipients)) {
            return NextResponse.json({ error: "Recipients must be an array" }, { status: 400 });
        }

        // Sanity check size
        if (recipients.length > 50000) {
            return NextResponse.json({ error: "Payload too large. Max 50000 recipients per batch." }, { status: 413 });
        }

        const result = await CampaignService.addRecipients(id, recipients);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Add recipients error:", error);
        return NextResponse.json({ error: "Failed to add recipients" }, { status: 500 });
    }
}
// POST existing

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user.role !== "PLATFORM_ADMIN" && session.user.role !== "QCTO_SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const skip = (page - 1) * limit;

        const where: any = { campaign_id: id };

        if (status && status !== "ALL") {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { email: { contains: search, mode: "insensitive" } },
                { first_name: { contains: search, mode: "insensitive" } },
                { last_name: { contains: search, mode: "insensitive" } },
                { organization_label: { contains: search, mode: "insensitive" } },
                { accepted_email: { contains: search, mode: "insensitive" } }
            ];
        }

        const [recipients, total] = await Promise.all([
            prisma.invite.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                select: {
                    invite_id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    organization_label: true,
                    status: true,
                    sent_at: true,
                    accepted_at: true,
                    accepted_email: true,
                }
            }),
            prisma.invite.count({ where })
        ]);

        return NextResponse.json({
            data: recipients,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Get recipients error:", error);
        return NextResponse.json({ error: "Failed to fetch recipients" }, { status: 500 });
    }
}
