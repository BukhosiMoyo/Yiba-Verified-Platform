import { prisma } from "@/lib/prisma";
import { NotificationService } from "../service";

const MIN_COMPLETENESS = 80;
const COOLDOWN_DAYS = 30;

export async function processProfileTriggers() {
    console.log(`[ProfileTrigger] Checking for users with profile completeness < ${MIN_COMPLETENESS}%...`);

    const incompleteUsers = await prisma.user.findMany({
        where: {
            profile_completeness: { lt: MIN_COMPLETENESS },
            status: "ACTIVE",
            onboarding_completed: true // Only nudge after they think they are done? Or maybe strictly during onboarding?
            // Let's assume after onboarding they might still have gaps.
        },
        select: {
            user_id: true,
            first_name: true,
            email: true,
            profile_completeness: true
        },
        take: 50
    });

    if (incompleteUsers.length === 0) return { processed: 0, sent: 0 };

    let sentCount = 0;

    for (const user of incompleteUsers) {
        const recentlyNotified = await prisma.notification.findFirst({
            where: {
                user_id: user.user_id,
                notification_type: "PROFILE_INCOMPLETE",
                created_at: { gt: new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000) }
            }
        });

        if (recentlyNotified) continue;

        await NotificationService.send({
            userId: user.user_id,
            type: "PROFILE_INCOMPLETE",
            title: "Complete Your Profile",
            message: `Your profile is only ${user.profile_completeness}% complete. Add more details to improve your trust score and visibility.`,
            category: "SYSTEM",
            priority: "LOW", // Low priority for nudges
            channels: ["IN_APP", "EMAIL"],
            actionLink: "/profile/edit", // Assumed path
        });

        sentCount++;
    }

    return { processed: incompleteUsers.length, sent: sentCount };
}
