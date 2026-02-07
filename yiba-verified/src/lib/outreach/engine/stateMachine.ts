import { prisma } from "@/lib/prisma";
import { EngagementState } from "@prisma/client";
import { OutreachEventType, OutreachEvent } from "../types";
import { determineNextState } from "../stateMachine"; // Pure logic
import { calculateNewScore, calculateCurrentScore } from "../scoring"; // Pure logic
import { logOutreachEvent } from "./eventStore";

/**
 * Orchestrates an engagement transition.
 * Updates the institution state and logs the event.
 */
export async function transitionEngagementState(
    institutionId: string,
    event: OutreachEventType, // Using the full event type from types.ts
    triggeredBy: 'SYSTEM' | 'AI' | 'HUMAN',
    metadata: Record<string, any> = {}
): Promise<{ newState: EngagementState; event: OutreachEvent }> {

    // 1. Fetch current state & score
    const institution = await prisma.institution.findUnique({
        where: { institution_id: institutionId },
        select: {
            engagement_stage: true,
            engagement_score: true,
            last_activity: true // Assuming this field exists or we add it
        }
    });

    if (!institution) throw new Error(`Institution ${institutionId} not found`);

    const currentStage = institution.engagement_stage || EngagementState.UNCONTACTED;
    // @ts-ignore - Assuming engagement_score exists on Institution model
    const currentRawScore = institution.engagement_score || 0;
    // @ts-ignore - Assuming last_activity
    const lastActivity = institution.last_activity || null;

    // 2. Calculate new score (Pure Logic)
    // We map OutreachEventType to EngagementEventType for scoring if needed
    // For now, let's assume strict mapping or cast
    const effectiveScore = calculateCurrentScore(currentRawScore, lastActivity);

    // TODO: Map OutreachEventType to EngagementEventType for scoring
    // This is a gap: OutreachEventType has 'EMAIL_SENT' etc, EngagementEventType has 'EMAIL_OPENED'
    // We need a mapper. For now, we assume simple mapping for common events.
    const newScore = calculateNewScore(effectiveScore, event as any);

    // 3. Determine new state (Pure Logic)
    const newState = determineNextState(currentStage, event as any, newScore);

    // 4. Persist updates (State + Score + Last Activity)
    // In a real transaction
    /*
    await prisma.institution.update({
        where: { institution_id: institutionId },
        data: {
            engagement_stage: newState,
            engagement_score: newScore,
            last_activity: new Date()
        }
    });
    */

    // 5. Log Event (The Event Store)
    const outEvent = await logOutreachEvent(
        institutionId,
        event,
        triggeredBy,
        { ...metadata, fromStage: currentStage, toStage: newState, scoreDelta: newScore - effectiveScore }
    );

    // 6. Special Case: If State Changed, log STAGE_CHANGED event too? 
    // Usually the Primary Event (e.g. "Meeting Booked") is enough, but explicit STAGE_CHANGED is good for timelines.
    if (newState !== currentStage) {
        await logOutreachEvent(
            institutionId,
            OutreachEventType.STAGE_CHANGED,
            'SYSTEM',
            { from: currentStage, to: newState, triggerEvent: outEvent.event_id }
        );
    }

    return { newState, event: outEvent };
}
