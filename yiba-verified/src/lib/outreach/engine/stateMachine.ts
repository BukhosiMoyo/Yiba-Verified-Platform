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
            institution_id: true,
            // engagement_stage: true, // Missing in schema
            // engagement_score: true, // Missing in schema
            // last_activity: true     // Missing in schema
        }
    });

    if (!institution) throw new Error(`Institution ${institutionId} not found`);

    // Mock values until schema is updated
    const currentStage = EngagementState.UNCONTACTED;
    const currentRawScore = 0;
    const lastActivity = null;

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
