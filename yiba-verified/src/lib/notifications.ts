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
  | "SYSTEM_ALERT"
  | "ISSUE_RESPONSE"
  | "INVITE_ACCEPTED"
  | "READINESS_SUBMITTED"
  | "REVIEW_ASSIGNED"
  | "BULK_INVITE_COMPLETED"
  | "INSTITUTION_CREATED"
  | "NEW_LEAD"
  | "SERVICE_REQUEST";

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
    // Optional: write to audit log (NOTIFICATION_CREATE_FAILED, entity_type, entity_id, recipient user_id)
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
    status: "RECOMMENDED" | "REJECTED" | "UNDER_REVIEW" | "RETURNED_FOR_CORRECTION"
  ) => {
    const statusMessages: Record<string, string> = {
      RECOMMENDED: "Your readiness record has been recommended by QCTO.",
      REJECTED: "Your readiness record has been rejected by QCTO.",
      UNDER_REVIEW: "Your readiness record is now under review by QCTO.",
      RETURNED_FOR_CORRECTION: "Your readiness record has been returned for correction by QCTO. Please address the feedback and resubmit.",
    };
    const titles: Record<string, string> = {
      RECOMMENDED: "Readiness Record Recommended",
      REJECTED: "Readiness Record Rejected",
      UNDER_REVIEW: "Readiness Record Under Review",
      RETURNED_FOR_CORRECTION: "Readiness Record Returned for Correction",
    };
    const types: Record<string, NotificationType> = {
      RECOMMENDED: "READINESS_RECOMMENDED",
      REJECTED: "READINESS_REJECTED",
      UNDER_REVIEW: "READINESS_REVIEWED",
      RETURNED_FOR_CORRECTION: "READINESS_REVIEWED",
    };

    return createNotification({
      user_id: userId,
      notification_type: types[status] ?? "READINESS_REVIEWED",
      title: titles[status] ?? "Readiness Record Updated",
      message: statusMessages[status] ?? "Your readiness record status has been updated.",
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

  inviteAccepted: async (userId: string, institutionId: string, inviteeEmail?: string) => {
    return createNotification({
      user_id: userId,
      notification_type: "INVITE_ACCEPTED",
      title: "Invite Accepted",
      message: inviteeEmail
        ? `${inviteeEmail} has accepted your invitation and joined.`
        : "A user has accepted your invitation and joined.",
      entity_type: "INSTITUTION",
      entity_id: institutionId,
    });
  },

  readinessSubmitted: async (userId: string, readinessId: string, qualificationTitle?: string) => {
    return createNotification({
      user_id: userId,
      notification_type: "READINESS_SUBMITTED",
      title: "New Readiness Record Submitted",
      message: qualificationTitle
        ? `A new Form 5 readiness record has been submitted: ${qualificationTitle}.`
        : "A new Form 5 readiness record has been submitted for review.",
      entity_type: "READINESS",
      entity_id: readinessId,
    });
  },

  reviewAssigned: async (userId: string, reviewType: string, reviewId: string) => {
    return createNotification({
      user_id: userId,
      notification_type: "REVIEW_ASSIGNED",
      title: "New Review Assignment",
      message: `You have been assigned a ${reviewType.toLowerCase()} review.`,
      entity_type: reviewType === "READINESS" ? "READINESS" : reviewType === "SUBMISSION" ? "SUBMISSION" : "QCTO_REQUEST",
      entity_id: reviewId,
    });
  },

  bulkInviteCompleted: async (userId: string, successCount: number, failCount: number, batchId?: string) => {
    return createNotification({
      user_id: userId,
      notification_type: "BULK_INVITE_COMPLETED",
      title: "Bulk Invite Completed",
      message: `${successCount} invite(s) sent${failCount > 0 ? `, ${failCount} failed` : ""}.`,
      entity_type: batchId ? "BULK_INVITE" : undefined,
      entity_id: batchId ?? undefined,
    });
  },

  institutionCreated: async (userId: string, institutionId: string, institutionName?: string) => {
    return createNotification({
      user_id: userId,
      notification_type: "INSTITUTION_CREATED",
      title: "New Institution Registered",
      message: institutionName
        ? `A new institution has been registered: ${institutionName}.`
        : "A new institution has been registered.",
      entity_type: "INSTITUTION",
      entity_id: institutionId,
    });
  },

  issueResponse: async (userId: string, issueId: string, title: string, message: string) => {
    return createNotification({
      user_id: userId,
      notification_type: "ISSUE_RESPONSE",
      title,
      message,
      entity_type: "ISSUE_REPORT",
      entity_id: issueId,
    });
  },

  /**
   * Notify institution staff when a new lead is submitted via the public profile.
   * Resolves all INSTITUTION_ADMIN and INSTITUTION_STAFF for the institution and creates
   * an in-app notification + email for each (entity_type INSTITUTION_LEAD links to public-profile).
   */
  newLead: async (
    leadId: string,
    institutionId: string,
    leadSummary: { full_name: string; email: string; message?: string | null }
  ) => {
    const users = await prisma.user.findMany({
      where: {
        institution_id: institutionId,
        role: { in: ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"] },
        status: "ACTIVE",
      },
      select: { user_id: true },
    });
    const title = "New enquiry from your public profile";
    const message = leadSummary.message
      ? `${leadSummary.full_name} (${leadSummary.email}) sent an enquiry: "${leadSummary.message.slice(0, 100)}${leadSummary.message.length > 100 ? "…" : ""}"`
      : `${leadSummary.full_name} (${leadSummary.email}) submitted an enquiry through your public profile.`;
    for (const u of users) {
      createNotification({
        user_id: u.user_id,
        notification_type: "NEW_LEAD",
        title,
        message,
        entity_type: "INSTITUTION_LEAD",
        entity_id: leadId,
      }).catch((err) => console.error("Failed to create NEW_LEAD notification:", err));
    }
  },

  /**
   * Notify users assigned to a service type when a new service request is submitted.
   * Looks up UserServiceLead for the service_type and creates in-app + email for each.
   */
  serviceRequest: async (
    requestId: string,
    serviceType: string,
    summary: { full_name: string; email: string; organization?: string | null; message?: string | null }
  ) => {
    const users = await prisma.userServiceLead.findMany({
      where: { service_type: serviceType as "ACCREDITATION_HELP" | "ACCOUNTING_SERVICES" | "MARKETING_WEBSITES" | "GENERAL_INQUIRY" },
      select: { user_id: true },
    });
    const typeLabels: Record<string, string> = {
      ACCREDITATION_HELP: "Accreditation help",
      ACCOUNTING_SERVICES: "Accounting services",
      MARKETING_WEBSITES: "Websites & marketing",
      GENERAL_INQUIRY: "General inquiry",
    };
    const typeLabel = typeLabels[serviceType] || serviceType;
    const title = `New request: ${typeLabel}`;
    const message = summary.message
      ? `${summary.full_name} (${summary.email})${summary.organization ? ` from ${summary.organization}` : ""}: "${summary.message.slice(0, 120)}${summary.message.length > 120 ? "…" : ""}"`
      : `${summary.full_name} (${summary.email})${summary.organization ? ` from ${summary.organization}` : ""} requested ${typeLabel}.`;
    for (const u of users) {
      createNotification({
        user_id: u.user_id,
        notification_type: "SERVICE_REQUEST",
        title,
        message,
        entity_type: "SERVICE_REQUEST",
        entity_id: requestId,
      }).catch((err) => console.error("Failed to create SERVICE_REQUEST notification:", err));
    }
    // If no UserServiceLead for this type, notify platform admins (fallback for GENERAL_INQUIRY or unassigned types)
    if (users.length === 0) {
      const admins = await prisma.user.findMany({
        where: { role: "PLATFORM_ADMIN", deleted_at: null },
        select: { user_id: true },
      });
      for (const admin of admins) {
        createNotification({
          user_id: admin.user_id,
          notification_type: "SERVICE_REQUEST",
          title,
          message,
          entity_type: "SERVICE_REQUEST",
          entity_id: requestId,
        }).catch((err) => console.error("Failed to create SERVICE_REQUEST notification for admin:", err));
      }
    }
  },
};
