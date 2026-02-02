import { prisma } from "@/lib/prisma";
import { NotificationService } from "../service";

const INACTIVITY_THRESHOLD_DAYS = 30;
const COOLDOWN_DAYS = 30; // Don't annoy them more than once a month

export async function processInactivityTriggers() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_THRESHOLD_DAYS);

    console.log(`[InactivityTrigger] Checking for users inactive since ${cutoffDate.toISOString()}...`);

    // Find inactive users
    // We need to exclude users who have been notified recently about this to avoid spam.
    // Ideally, we'd have a tracking table for this, or query Notifications.
    // For simplicity, let's query users who are inactive AND haven't received an "INACTIVITY_WARNING" notification recently.
    // This query might be expensive if many users.

    // Optimization: Fetch users active < cutoff. Then filter in code or separate query.
    const inactiveUsers = await prisma.user.findMany({
        where: {
            last_active_at: {
                lt: cutoffDate,
            },
            status: "ACTIVE", // Only active accounts
            deleted_at: null,
            // Exclude if we sent a notification recently? 
            // Hard to do efficiently in one query without a dedicated 'last_inactivity_notification_at' field.
            // We will check notification history for each candidate (batching could improve this).
        },
        select: {
            user_id: true,
            first_name: true,
            email: true,
            last_active_at: true,
            role: true
        },
        take: 100 // Process in batches to avoid timeout
    });

    if (inactiveUsers.length === 0) return { processed: 0, sent: 0 };

    let sentCount = 0;

    for (const user of inactiveUsers) {
        // Check if we sent an inactivity warning in the last COOLDOWN_DAYS
        const cooldownDate = new Date();
        cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS);

        const recentNotification = await prisma.notification.findFirst({
            where: {
                user_id: user.user_id,
                notification_type: "INACTIVITY_WARNING",
                created_at: {
                    gt: cooldownDate
                }
            }
        });

        if (recentNotification) continue;

        // Send Re-engagement Notification
        await NotificationService.send({
            userId: user.user_id,
            type: "INACTIVITY_WARNING",
            title: "We miss you on Yiba Verified!",
            message: `Hi ${user.first_name}, it's been a while. Log back in to check your compliance status and new opportunities.`,
            category: "SYSTEM",
            priority: "NORMAL",
            channels: ["EMAIL", "IN_APP"], // Key is Email here
            actionLink: "/login",
            recipientRole: user.role
        });

        sentCount++;
    }

    return { processed: inactiveUsers.length, sent: sentCount };
}
