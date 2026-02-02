import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessQctoData } from "@/lib/rbac";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ institutionId: string }> }
) {
    try {
        const { institutionId: id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Role check: Only QCTO roles and Platform Admin can access detailed compliance data
        if (!canAccessQctoData(session.user.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const [compliance, contacts, qualifications] = await Promise.all([
            prisma.institutionCompliance.findUnique({
                where: { institution_id: id },
            }),
            prisma.institutionContact.findMany({
                where: { institution_id: id },
                orderBy: { type: "asc" },
                include: {
                    user: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.institutionQualification.findMany({
                where: { institution_id: id },
                include: {
                    registry: true,
                },
                orderBy: { created_at: "desc" },
            }),
        ]);

        return NextResponse.json({
            compliance,
            contacts,
            qualifications,
        });
    } catch (error) {
        console.error("Error fetching compliance data:", error);
        return NextResponse.json(
            { error: "Failed to fetch compliance data" },
            { status: 500 }
        );
    }
}
