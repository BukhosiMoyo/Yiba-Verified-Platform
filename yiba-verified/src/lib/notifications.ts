import { prisma } from "./prisma";
import { sendEmailNotification } from "./email";

export type NotificationType =
  | "SUBMISSION_REVIEWED"
  | "SUBMISSION_APPROVED"
  | "SUBMISSION_REJECTED"
  | "REQUEST_APPROVED"
  | "REQUEST_REJECTED"
  | "READINESS_REVIEWED"
  | "READINESS_RECOMMENDED"
  | "READINESS_REJECTED"
  | "DOCUMENT_FLAGGED"
  | "SYSTEM_ALERT";

interface CreateNotificationParams {
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
}

/**
 * createNotification
 * 
 * Helper function to create notifications for users.
 * Should be called after important actions (submission reviewed, request approved, etc.)
 * 
 * Also sends email notification if email service is configured.
 * 
 * Note: This should ideally be called within a transaction to ensure consistency,
 * but for MVP we'll create notifications independently.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        user_id: params.user_id,
        notification_type: params.notification_type,
        title: params.title,
        message: params.message,
        entity_type: params.entity_type || null,
        entity_id: params.entity_id || null,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Send email notification (async, don't wait - failures shouldn't block)
    if (notification.user?.email) {
      sendEmailNotification(
        notification.user.email,
        params.notification_type,
        params.title,
        params.message,
        params.entity_type || undefined,
        params.entity_id || undefined
      ).catch((error) => {
        console.error("Email notification failed (non-blocking):", error);
      });
    }

    return notification;
  } catch (error) {
    // Log error but don't throw - notifications shouldn't break the main flow
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Helper functions for common notification scenarios
 */
export const Notifications = {
  submissionReviewed: async (
    userId: string,
    submissionId: string,
    status: "APPROVED" | "REJECTED" | "UNDER_REVIEW"
  ) => {
    const statusMessages = {
      APPROVED: "Your submission has been approved by QCTO.",
      REJECTED: "Your submission has been rejected by QCTO.",
      UNDER_REVIEW: "Your submission is now under review by QCTO.",
    };

    return createNotification({
      user_id: userId,
      notification_type: status === "APPROVED" ? "SUBMISSION_APPROVED" : status === "REJECTED" ? "SUBMISSION_REJECTED" : "SUBMISSION_REVIEWED",
      title: `Submission ${status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Under Review"}`,
      message: statusMessages[status],
      entity_type: "SUBMISSION",
      entity_id: submissionId,
    });
  },

  requestApproved: async (userId: string, requestId: string) => {
    return createNotification({
      user_id: userId,
      notification_type: "REQUEST_APPROVED",
      title: "QCTO Request Approved",
      message: "Your QCTO request has been approved.",
      entity_type: "QCTO_REQUEST",
      entity_id: requestId,
    });
  },

  requestRejected: async (userId: string, requestId: string) => {
    return createNotification({
      user_id: userId,
      notification_type: "REQUEST_REJECTED",
      title: "QCTO Request Rejected",
      message: "Your QCTO request has been rejected.",
      entity_type: "QCTO_REQUEST",
      entity_id: requestId,
    });
  },

  readinessReviewed: async (
    userId: string,
    readinessId: string,
    status: "RECOMMENDED" | "REJECTED" | "UNDER_REVIEW"
  ) => {
    const statusMessages = {
      RECOMMENDED: "Your readiness record has been recommended by QCTO.",
      REJECTED: "Your readiness record has been rejected by QCTO.",
      UNDER_REVIEW: "Your readiness record is now under review by QCTO.",
    };

    return createNotification({
      user_id: userId,
      notification_type: status === "RECOMMENDED" ? "READINESS_RECOMMENDED" : status === "REJECTED" ? "READINESS_REJECTED" : "READINESS_REVIEWED",
      title: `Readiness Record ${status === "RECOMMENDED" ? "Recommended" : status === "REJECTED" ? "Rejected" : "Under Review"}`,
      message: statusMessages[status],
      entity_type: "READINESS",
      entity_id: readinessId,
    });
  },

  documentFlagged: async (userId: string, documentId: string) => {
    return createNotification({
      user_id: userId,
      notification_type: "DOCUMENT_FLAGGED",
      title: "Document Flagged",
      message: "One of your documents has been flagged by QCTO for review.",
      entity_type: "DOCUMENT",
      entity_id: documentId,
    });
  },
};
