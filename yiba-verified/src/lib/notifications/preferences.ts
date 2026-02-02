import { prisma } from "@/lib/prisma";
import { NotificationCategory, NotificationChannel } from "./types";

/**
 * Check if a user accepts notifications for a specific category and channel.
 * Returns true if allowed, false if blocked.
 */
export async function shouldSendNotification(
    userId: string,
    category: NotificationCategory,
    channel: NotificationChannel
): Promise<boolean> {
    // CRITICAL priority always bypasses preferences
    // (We handle this check in the Service, but good to have helper logic here if needed. 
    // actually, let's keep this function pure to preferences)

    try {
        const pref = await prisma.notificationPreference.findUnique({
            where: {
                user_id_category: {
                    user_id: userId,
                    category: category,
                },
            },
        });

        // Default to TRUE if no preference record exists
        if (!pref) {
            // Opt-out defaults: Marketing might default to false in future, but for now everything is opt-out
            return true;
        }

        if (channel === "EMAIL") return pref.email_enabled;
        if (channel === "IN_APP") return pref.in_app_enabled;
        if (channel === "SMS") return pref.sms_enabled;

        return true;
    } catch (error) {
        console.error("Error checking notification preferences:", error);
        // Fail safe: send the notification if checking fails
        return true;
    }
}

/**
 * Get all preferences for a user
 */
export async function getUserPreferences(userId: string) {
    return prisma.notificationPreference.findMany({
        where: { user_id: userId },
    });
}

/**
 * Update a specific preference
 */
export async function updatePreference(
    userId: string,
    category: NotificationCategory,
    changes: { email?: boolean; in_app?: boolean; sms?: boolean }
) {
    return prisma.notificationPreference.upsert({
        where: {
            user_id_category: {
                user_id: userId,
                category,
            },
        },
        update: {
            email_enabled: changes.email,
            in_app_enabled: changes.in_app,
            sms_enabled: changes.sms,
        },
        create: {
            user_id: userId,
            category,
            email_enabled: changes.email ?? true,
            in_app_enabled: changes.in_app ?? true,
            sms_enabled: changes.sms ?? false,
        },
    });
}
