import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { generateAttendanceCSV } from "@/lib/submissions/generators/attendance-export";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { ctx } = await requireAuth(request);

        // RBAC
        if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
            throw new AppError(ERROR_CODES.FORBIDDEN, "Not allowed to export items", 403);
        }

        const { itemId } = await params;

        // 1. Fetch Item
        const item = await prisma.submissionItem.findUnique({
            where: { submission_item_id: itemId },
            include: {
                submission: {
                    select: {
                        institution_id: true,
                        reference_code: true
                    }
                }
            }
        });

        if (!item) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "Submission Item not found", 404);
        }

        // 2. Scoping
        if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
            if (!ctx.institutionId || ctx.institutionId !== item.submission.institution_id) {
                throw new AppError(ERROR_CODES.FORBIDDEN, "Item belongs to another institution", 403);
            }
        }

        // 3. Generate content based on type
        let csvContent = "";
        let filename = `submission_${item.submission.reference_code || "draft"}_export.csv`;

        if (item.type === "ATTENDANCE") {
            const config = item.config_json as any;
            if (!config || !config.cohort_id || !config.start_date || !config.end_date) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid configuration for Attendance item", 400);
            }
            csvContent = await generateAttendanceCSV(config);
            filename = `attendance_${item.submission.reference_code || "draft"}.csv`;
        } else {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Export for type ${item.type} not implemented yet`, 501);
        }

        // 4. Return CSV Response
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        return fail(error);
    }
}
