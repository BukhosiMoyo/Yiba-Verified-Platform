import { prisma } from "@/lib/prisma";
import { OutreachEventType } from "../types";
import { calculateNewScore, calculateCurrentScore } from "../scoring";
import { logOutreachEvent } from "./eventStore";

/**
 * Updates the engagement score for an institution based on an event.
 * This is arguably redundant with transitionEngagementState, but sometimes 
 * we just want to update score without forcing a state machine check (though usually they go together).
 */
export async function updateEngagementScore(
    institutionId: string,
    event: OutreachEventType
): Promise<number> {

    const institution = await prisma.institution.findUnique({
        where: { institution_id: institutionId },
        select: { institution_id: true } // Just verifying existence
    });

    if (!institution) throw new Error("Institution not found");

    // Mock values until schema is updated
    const currentScore = 0;
    const lastActivity = null;

    const effective = calculateCurrentScore(currentScore, lastActivity);
    const newScore = calculateNewScore(effective, event as any);

    // Persist
    /*
    await prisma.institution.update({
        where: { institution_id: institutionId },
        data: { engagement_score: newScore, last_activity: new Date() }
    });
    */

    return newScore;
}
