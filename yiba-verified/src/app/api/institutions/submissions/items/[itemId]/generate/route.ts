import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { generateAttendanceSnapshot } from "@/lib/submissions/generators/attendance";

/**
 * POST /api/institutions/submissions/items/[itemId]/generate
 * 
 * Generates the snapshot data for a specific submission item.
 * - Reads config (e.g. cohort, dates)
 * - Queries actual data (e.g. attendance records)
 * - Updates the item with the snapshot and marks as GENERATED.
 * 
 * Allowed Roles: INSTITUTION_ADMIN, INSTITUTION_STAFF (for own inst), PLATFORM_ADMIN
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { ctx } = await requireAuth(request);

        // RBAC
        if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
            throw new AppError(ERROR_CODES.FORBIDDEN, "Not allowed to generate items", 403);
        }

        const { itemId } = await params;

        // 1. Fetch Item with Submission context (for scoping)
        const item = await prisma.submissionItem.findUnique({
            where: { submission_item_id: itemId },
            include: {
                submission: {
                    select: {
                        institution_id: true,
                        status: true,
                    }
                }
            }
        });

        if (!item) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "Submission Item not found", 404);
        }

        // 2. Institution Scoping
        if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
            if (!ctx.institutionId || ctx.institutionId !== item.submission.institution_id) {
                throw new AppError(ERROR_CODES.FORBIDDEN, "Item belongs to another institution", 403);
            }
        }

        // 3. Status Checks
        // Can only generate if submission is DRAFT (or maybe SUBMITTED if we allow refreshing during review? Usually not)
        // Let's stick to DRAFT only for now.
        if (item.submission.status !== "DRAFT") {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Cannot generate snapshot: Submission is ${item.submission.status}`, 400);
        }

        // item.status checks?
        // If LOCKED, cannot regenerate.
        if (item.status === "LOCKED") {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Cannot generate snapshot: Item is LOCKED", 400);
        }

        // 4. Generate Snapshot based on Type
        let snapshotResult: any = null;

        if (item.type === "ATTENDANCE") {
            const config = item.config_json as any;
            if (!config || !config.cohort_id || !config.start_date || !config.end_date) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid configuration for Attendance item", 400);
            }
            snapshotResult = await generateAttendanceSnapshot(config);
        } else {
            // Future types
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Generation schema for type ${item.type} not implemented yet`, 501);
        }

        // 5. Update Item
        const updatedItem = await mutateWithAudit({
            ctx,
            entityType: "SUBMISSION", // Logging as SUBMISSION modification since items are part of it? Or maybe I should add SUBMISSION_ITEM to AuditEntityType.
            // Reuse SUBMISSION for now using submission_id
            changeType: "UPDATE",
            fieldName: "items",
            institutionId: item.submission.institution_id,
            reason: "Generate Snapshot",
            assertCan: async () => { }, // Verified above
            mutation: async (tx) => {
                return await tx.submissionItem.update({
                    where: { submission_item_id: itemId },
                    data: {
                        status: "GENERATED",
                        metrics_snapshot_json: snapshotResult.metrics_snapshot_json,
                        included_record_ids_json: snapshotResult.included_record_ids_json,
                        generated_at: new Date(),
                        // data_hash: ... (TODO: Implement hashing)
                    }
                });
            }
        });

        return NextResponse.json(updatedItem, { status: 200 });

    } catch (error) {
        return fail(error);
    }
}
