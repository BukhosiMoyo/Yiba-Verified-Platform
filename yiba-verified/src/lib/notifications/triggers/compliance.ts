import { prisma } from "@/lib/prisma";
import { NotificationService } from "../service";

const EXPIRY_THRESHOLD_DAYS = 30; // Notify if expiring in 30 days
const COOLDOWN_DAYS = 30;

export async function processComplianceTriggers() {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + EXPIRY_THRESHOLD_DAYS);
    const today = new Date();

    console.log(`[ComplianceTrigger] Checking for documents expiring between ${today.toISOString()} and ${futureDate.toISOString()}...`);

    // Find users with documents expiring soon
    // We'll look at the `Document` model. 
    // Wait, does `Document` model have expiry_date?
    // Let's check schema details from previous views.
    // Schema snippet for Document (Step 153) didn't show expiry_date. 
    // Let's check `InstitutionCompliance` model (Step 153 line 66) - it has `expiry_date`.
    // Also `QualificationRegistry` has `effective_to`.

    // Let's focus on `InstitutionCompliance` expiry (Accreditation expiry).

    const expiringCompliances = await prisma.institutionCompliance.findMany({
        where: {
            expiry_date: {
                gte: today,
                lte: futureDate,
            },
            accreditation_status: "ACTIVE", // Only warn active ones
        },
        include: {
            institution: {
                include: {
                    contacts: true, // Notify contacts
                    // Also notify users linked to institution?
                }
            }
        }
    });

    let sentCount = 0;

    for (const item of expiringCompliances) {
        // Find recipients: Institution Admin/Contacts
        // We can notify the Institution contacts with type 'ACCREDITATION_CONTACT' or 'PRIMARY'
        // And/or users with role INSTITUTION_ADMIN linked to this institution.

        const recipients = await prisma.user.findMany({
            where: {
                institution_id: item.institution_id,
                role: "INSTITUTION_ADMIN",
                status: "ACTIVE"
            },
            select: { user_id: true }
        });

        for (const user of recipients) {
            // Check cooldown
            const recentlyNotified = await prisma.notification.findFirst({
                where: {
                    user_id: user.user_id,
                    notification_type: "COMPLIANCE_EXPIRY",
                    entity_id: item.id, // compliant record id
                    created_at: { gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            });

            if (recentlyNotified) continue;

            await NotificationService.send({
                userId: user.user_id,
                type: "COMPLIANCE_EXPIRY",
                title: "Accreditation Expiring Soon",
                message: `Your accreditation for ${item.institution.legal_name} is expiring on ${item.expiry_date?.toLocaleDateString()}. Please take action.`,
                category: "COMPLIANCE",
                priority: "HIGH",
                channels: ["EMAIL", "IN_APP"],
                resourceType: "INSTITUTION_COMPLIANCE",
                resourceId: item.id,
                institutionId: item.institution_id
            });
            sentCount++;
        }
    }

    return { processed: expiringCompliances.length, sent: sentCount };
}
