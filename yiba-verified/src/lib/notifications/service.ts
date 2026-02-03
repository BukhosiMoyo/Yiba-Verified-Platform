import { prisma } from "@/lib/prisma";
import {
    CreateNotificationParams,
    NotificationServiceResult,
    NotificationChannel,
    NotificationPriority
} from "./types";
import { shouldSendNotification } from "./preferences";

export class NotificationService {
    /**
     * Send a notification through configured channels.
     * Handles preferences, RBAC safety (basic), and queueing.
     */
    static async send(params: CreateNotificationParams): Promise<NotificationServiceResult> {
        const {
            userId,
            type,
            title,
            message,
            category = "SYSTEM",
            priority = "NORMAL",
            channels = ["IN_APP", "EMAIL"], // Default channels
            resourceType,
            resourceId,
            recipientRole,
            institutionId,
            actionLink,
        } = params;

        const result: NotificationServiceResult = {};

        try {
            // 1. Safety Checks
            // 1. Safety Checks
            if (recipientRole) {
                const user = await prisma.user.findUnique({
                    where: { user_id: userId },
                    select: { role: true }
                });
                // If user role doesn't match required recipientRole, we skip or error.
                // Let's log a warning and return skipped.
                if (user?.role !== recipientRole) {
                    console.warn(`NotificationService: Skipped notification for user ${userId}. Role mismatch. Required: ${recipientRole}, Actual: ${user?.role}`);
                    result.skipped = true;
                    return result;
                }
            }

            // 2. Determine actual channels to use based on Preferences & Priority
            const textChannels: NotificationChannel[] = [];

            for (const ch of channels) {
                // CRITICAL priority overrides preferences
                if (priority === "CRITICAL") {
                    textChannels.push(ch);
                    continue;
                }

                // Otherwise check preferences
                const allowed = await shouldSendNotification(userId, category, ch);
                if (allowed) {
                    textChannels.push(ch);
                }
            }

            // 3. Dispatch - In-App
            if (textChannels.includes("IN_APP")) {
                const notification = await prisma.notification.create({
                    data: {
                        user_id: userId,
                        notification_type: type,
                        title,
                        message,
                        category,
                        priority,
                        channels: textChannels,
                        resource_type: resourceType,
                        resource_id: resourceId,
                        // Populate legacy fields for UI compatibility (types.ts uses entity_type)
                        entity_type: resourceType,
                        entity_id: resourceId,
                        recipient_role: recipientRole,
                        institution_id: institutionId,
                        action_link: actionLink,
                    },
                });
                result.notificationId = notification.notification_id;
            }



            // Fix for Email block above:
            if (textChannels.includes("EMAIL")) {
                const user = await prisma.user.findUnique({
                    where: { user_id: userId },
                    select: { email: true }
                });

                if (user?.email) {
                    const queuePriority = priority === "CRITICAL" || priority === "HIGH" ? "HIGH" : "NORMAL";

                    // User Request: "Make sure emails are not just being queued"
                    // Attempt immediate send
                    let sentImmediately = false;
                    let errorMsg = null;

                    try {
                        const { getEmailService } = await import("@/lib/email");
                        const { EmailType } = await import("@/lib/email/types");
                        const emailService = getEmailService();

                        const htmlBody = `<p>${message}</p>${actionLink ? `<br><a href="${actionLink}">View Details</a>` : ''}`;

                        const res = await emailService.send({
                            to: user.email,
                            type: EmailType.NOTIFICATION,
                            subject: title,
                            text: message,
                            html: htmlBody
                        });

                        if (res.success) {
                            sentImmediately = true;
                        } else {
                            errorMsg = res.error;
                        }

                    } catch (e: any) {
                        console.error("[NotificationService] Immediate send failed:", e);
                        errorMsg = e.message;
                    }

                    // Log to DB (as SENT or PENDING if failed)
                    await prisma.emailQueue.create({
                        data: {
                            user_id: userId,
                            to_email: user.email,
                            subject: title,
                            body_text: message,
                            body_html: `<p>${message}</p>${actionLink ? `<br><a href="${actionLink}">View Details</a>` : ''}`,
                            status: sentImmediately ? "SENT" : "PENDING", // PENDING means worker will retry
                            sent_at: sentImmediately ? new Date() : null,
                            priority: queuePriority,
                            error_message: errorMsg || (sentImmediately ? null : "Immediate send failed, queued for retry")
                        }
                    });

                    result.emailQueued = !sentImmediately;
                    if (sentImmediately) result.emailSent = true;
                }
            }

            // 5. Dispatch - SMS (Future)
            if (textChannels.includes("SMS")) {
                // console.log("SMS not implemented yet");
                // result.smsQueued = false; 
            }

            return result;

        } catch (error) {
            console.error("NotificationService Error:", error);
            result.error = error;
            return result;
        }
    }
}
