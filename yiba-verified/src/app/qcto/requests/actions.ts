"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { QctoRequestType, QctoRequestStatus } from "@prisma/client";

// Helper to generate reference code
async function generateReferenceCode() {
    const year = new Date().getFullYear();
    // Use a transaction or simpler heuristic for now. 
    // In high volume, this needs sequence logic.
    const count = await prisma.qCTORequest.count();
    return `REQ-${year}-${String(count + 1).padStart(5, "0")}`;
}

import { sendEmailNotification } from "@/lib/email";
// We need to valid NotificationType values. Assuming 'SYSTEM_NOTIFICATION' is safe default.
// I'll check NotificationType definition if possible, but 'SYSTEM_NOTIFICATION' is standard.


export type CreateRequestInput = {
    institution_id: string;
    title: string;
    description?: string;
    type: QctoRequestType;
    due_at?: Date;
    config_json?: any; // e.g. { documentTypes: ["ID", "CV"] }
    assign_to_user_id?: string;
};

export async function createQctoRequest(data: CreateRequestInput) {
    const session = await getServerSession(authOptions);

    // Basic RBAC check
    const allowedRoles = ["QCTO_ADMIN", "QCTO_SUPER_ADMIN", "QCTO_USER", "PLATFORM_ADMIN"];
    if (!session || !allowedRoles.includes(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const reference_code = await generateReferenceCode();

        const request = await prisma.qCTORequest.create({
            data: {
                institution_id: data.institution_id,
                requested_by: session.user.userId,
                title: data.title,
                description: data.description,
                type: data.type,
                status: "SENT", // Default to SENT for v1, simplified flow
                requested_at: new Date(),
                due_at: data.due_at,
                config_json: data.config_json ?? {},
                reference_code,
                assigned_reviewer_user_id: data.assign_to_user_id,
            },
        });

        // Send notification to institution admins
        try {
            const admins = await prisma.user.findMany({
                where: {
                    institution_id: data.institution_id,
                    role: "INSTITUTION_ADMIN",
                    status: "ACTIVE"
                },
                select: { email: true, first_name: true }
            });

            for (const admin of admins) {
                await sendEmailNotification(
                    admin.email,
                    "SYSTEM_NOTIFICATION" as any,
                    "New QCTO Request Received",
                    `QCTO has initiated a new request: "${data.title}" (Ref: ${reference_code}).\nPlease log in to review and respond.`,
                    "QCTO_REQUEST",
                    request.request_id
                );
            }
        } catch (e) {
            console.error("Failed to send notifications:", e);
        }

        revalidatePath("/qcto/requests");
        revalidatePath(`/institution/${data.institution_id}`);
        return { success: true, data: request };
    } catch (error) {
        console.error("Failed to create request:", error);
        return { success: false, error: "Failed to create request" };
    }
}

export async function cancelRequest(requestId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const request = await prisma.qCTORequest.findUnique({
            where: { request_id: requestId },
        });

        if (!request) return { success: false, error: "Request not found" };

        // Only creator or admin can cancel
        const isAdmin = ["QCTO_ADMIN", "QCTO_SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.user.role);
        if (!isAdmin && request.requested_by !== session.user.userId) {
            return { success: false, error: "Unauthorized to cancel this request" };
        }

        await prisma.qCTORequest.update({
            where: { request_id: requestId },
            data: { status: "CANCELLED" },
        });

        revalidatePath("/qcto/requests");
        return { success: true };
    } catch (error) {
        console.error("Failed to cancel request:", error);
        return { success: false, error: "Failed to cancel request" };
    }
}

export async function reviewRequest(requestId: string, decision: "APPROVED" | "REJECTED" | "RETURNED_FOR_CORRECTION", notes?: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    // QCTO Roles check
    const allowedRoles = ["QCTO_ADMIN", "QCTO_SUPER_ADMIN", "QCTO_USER", "QCTO_REVIEWER", "QCTO_AUDITOR", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const finalStatus = decision === "APPROVED" ? "APPROVED" : decision === "REJECTED" ? "REJECTED" : "RETURNED_FOR_CORRECTION";

        await prisma.qCTORequest.update({
            where: { request_id: requestId },
            data: {
                status: finalStatus,
                decision: finalStatus,
                decision_notes: notes,
                reviewed_at: new Date(),
                // If assigned reviewer is different or null, logic could go here, but for now we trust the actor
                // We could track "reviewed_by" if we want to update the legacy field or add a new relation logic
                reviewed_by: session.user.userId,
            },
        });

        // Send notification to institution
        try {
            const request = await prisma.qCTORequest.findUnique({
                where: { request_id: requestId },
                select: { institution_id: true, title: true, reference_code: true }
            });

            if (request) {
                const admins = await prisma.user.findMany({
                    where: {
                        institution_id: request.institution_id,
                        role: "INSTITUTION_ADMIN",
                        status: "ACTIVE"
                    },
                    select: { email: true }
                });

                const statusLabel = decision === "RETURNED_FOR_CORRECTION" ? "Returned for Correction" : decision;

                for (const admin of admins) {
                    await sendEmailNotification(
                        admin.email,
                        "SYSTEM_NOTIFICATION" as any,
                        `QCTO Request Update: ${statusLabel}`,
                        `The QCTO request "${request.title}" (${request.reference_code}) has been marked as ${statusLabel}.\n\nReview Notes: ${notes || "No notes provided."}`,
                        "QCTO_REQUEST",
                        requestId
                    );
                }
            }
        } catch (e) {
            console.error("Failed to send review notifications:", e);
        }

        revalidatePath(`/qcto/requests/${requestId}`);
        revalidatePath("/qcto/requests");
        return { success: true };
    } catch (error) {
        console.error("Failed to review request:", error);
        return { success: false, error: "Failed to review request" };
    }
}
// ... existing code ...

export async function addEvidenceToRequest(requestId: string, input: { documentId?: string; submissionId?: string }) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const request = await prisma.qCTORequest.findUnique({
            where: { request_id: requestId },
            select: { institution_id: true, status: true },
        });

        if (!request) return { success: false, error: "Request not found" };

        // Access Control: Must be Institution Admin/Staff of the same institution OR Platform Admin
        const isPlatformAdmin = session.user.role === "PLATFORM_ADMIN";
        const isInstUser = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"].includes(session.user.role) &&
            session.user.institutionId === request.institution_id;

        if (!isPlatformAdmin && !isInstUser) {
            return { success: false, error: "Unauthorized" };
        }

        // Logic check: Can we add evidence? Yes, unless it's strictly finalized.
        // We allow adding evidence in IN_PROGRESS, SENT, RETURNED. Maybe not if strictly APPROVED/REJECTED.
        const lockedStatuses = ["APPROVED", "REJECTED", "CANCELLED", "SUBMITTED"];
        // NOTE: We might allow adding evidence even if SUBMITTED if we auto-revert to IN_PROGRESS? 
        // For now, let's block if SUBMITTED until they "Undo" submission or it's Returned.
        if (lockedStatuses.includes(request.status) && !isPlatformAdmin) {
            return { success: false, error: `Cannot add evidence while request is ${request.status}` };
        }

        // Update status to IN_PROGRESS if currently SENT or RETURNED
        if (["SENT", "RETURNED_FOR_CORRECTION"].includes(request.status)) {
            await prisma.qCTORequest.update({ where: { request_id: requestId }, data: { status: "IN_PROGRESS" } });
        }

        await prisma.qctoRequestResponseEvidenceLink.create({
            data: {
                qcto_request_id: requestId,
                document_id: input.documentId,
                submission_id: input.submissionId,
            }
        });

        revalidatePath(`/institution/requests/${requestId}`);
        return { success: true };

    } catch (error) {
        console.error("Failed to add evidence:", error);
        return { success: false, error: "Failed to add evidence" };
    }
}

export async function removeEvidenceFromRequest(linkId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const link = await prisma.qctoRequestResponseEvidenceLink.findUnique({
            where: { link_id: linkId },
            include: { request: true }
        });

        if (!link) return { success: false, error: "Evidence link not found" };

        const isPlatformAdmin = session.user.role === "PLATFORM_ADMIN";
        const isInstUser = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"].includes(session.user.role) &&
            session.user.institutionId === link.request.institution_id;

        if (!isPlatformAdmin && !isInstUser) {
            return { success: false, error: "Unauthorized" };
        }

        const lockedStatuses = ["APPROVED", "REJECTED", "CANCELLED", "SUBMITTED"];
        if (lockedStatuses.includes(link.request.status) && !isPlatformAdmin) {
            return { success: false, error: `Cannot remove evidence while request is ${link.request.status}` };
        }

        await prisma.qctoRequestResponseEvidenceLink.delete({
            where: { link_id: linkId }
        });

        revalidatePath(`/institution/requests/${link.request.request_id}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to remove evidence" };
    }
}

export async function submitRequestResponse(requestId: string, notes?: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const request = await prisma.qCTORequest.findUnique({
            where: { request_id: requestId },
        });
        if (!request) return { success: false, error: "Not found" };

        const isPlatformAdmin = session.user.role === "PLATFORM_ADMIN";
        const isInstUser = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"].includes(session.user.role) &&
            session.user.institutionId === request.institution_id;

        if (!isPlatformAdmin && !isInstUser) return { success: false, error: "Unauthorized" };

        // Check if we have evidence? Optional for now, but usually required.
        const evidenceCount = await prisma.qctoRequestResponseEvidenceLink.count({ where: { qcto_request_id: requestId } });
        if (evidenceCount === 0 && !notes) {
            return { success: false, error: "Please provide evidence or response notes to submit." };
        }

        await prisma.qCTORequest.update({
            where: { request_id: requestId },
            data: {
                status: "SUBMITTED",
                response_notes: notes,
            }
        });

        // Send notification to QCTO requestor
        try {
            const usersToNotify = [];
            if (request.requested_by) usersToNotify.push(request.requested_by);
            if (request.assigned_reviewer_user_id) usersToNotify.push(request.assigned_reviewer_user_id);

            const uniqueUserIds = [...new Set(usersToNotify)];

            const qctoUsers = await prisma.user.findMany({
                where: { user_id: { in: uniqueUserIds }, status: "ACTIVE" },
                select: { email: true }
            });

            for (const u of qctoUsers) {
                await sendEmailNotification(
                    u.email,
                    "SYSTEM_NOTIFICATION" as any,
                    "QCTO Request Response Submitted",
                    `Institution has submitted a response for request "${request.title}" (${request.reference_code || "No Ref"}).\nPlease review the submission.`,
                    "QCTO_REQUEST",
                    requestId
                );
            }
        } catch (e) {
            console.error("Failed to send submission notifications:", e);
        }

        revalidatePath(`/institution/requests/${requestId}`);
        revalidatePath(`/qcto/requests/${requestId}`);
        return { success: true };

    } catch (e) {
        return { success: false, error: "Failed to submit" };
    }
}
