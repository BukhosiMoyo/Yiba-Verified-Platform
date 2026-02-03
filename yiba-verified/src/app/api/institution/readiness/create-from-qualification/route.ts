/**
 * POST /api/institution/readiness/create-from-qualification
 * Helper to initialize a readiness form from a Qualification.
 * 
 * Body: { qualificationId: string }
 * Returns: { readinessId: string, redirectUrl: string }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        // RBAC: Institution Admin or authorized Staff
        if (!ctx.institutionId) {
            throw new AppError(ERROR_CODES.FORBIDDEN, "Must be an institution user", 403);
        }
        // TODO: finer grained permission check (can_manage_readiness?)

        const body = await request.json();
        const { qualificationId } = body;

        if (!qualificationId) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "qualificationId is required", 400);
        }

        // Fetch Qualification
        const qualification = await prisma.qualification.findUnique({
            where: { qualification_id: qualificationId },
        });

        if (!qualification) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "Qualification not found", 404);
        }

        const readiness = await mutateWithAudit({
            ctx,
            entityType: "READINESS",
            changeType: "CREATE",
            fieldName: "readiness_id",
            assertCan: async () => { }, // TODO
            mutation: async (tx) => {
                // Map study_mode to delivery_mode
                let deliveryMode = "FACE_TO_FACE"; // Default
                if (qualification.study_mode === "ONLINE" || qualification.study_mode === "HYBRID") {
                    deliveryMode = "BLENDED";
                }

                return tx.readiness.create({
                    data: {
                        institution_id: ctx.institutionId!,
                        qualification_id: qualification.qualification_id,
                        qualification_title: qualification.name,
                        // Prefill other fields
                        nqf_level: qualification.nqf_level,

                        // We need to provide required fields for Readiness:
                        saqa_id: qualification.saqa_id || "PENDING",
                        curriculum_code: qualification.curriculum_code || "PENDING",

                        // Cast to any to avoid strict Enum typing issues if types aren't generated yet or mismatch
                        delivery_mode: deliveryMode as any,

                        readiness_status: "NOT_STARTED",
                    }
                });
            }
        });

        return ok({
            readinessId: readiness.readiness_id,
            redirectUrl: `/institution/readiness/${readiness.readiness_id}`
        });

    } catch (error) {
        // If validation error (e.g. enum mismatch), simplify
        return fail(error);
    }
}
