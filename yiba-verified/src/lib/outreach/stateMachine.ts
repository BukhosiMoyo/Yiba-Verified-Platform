import { EngagementState, EngagementEventType, ENGAGEMENT_THRESHOLD } from "./types";

/**
 * Determines the next engagement state based on the current state, the event that occurred, 
 * and the CURRENT effective score (after the event points have been added).
 * 
 * @param currentState The current state of the institution.
 * @param event The event that just occurred.
 * @param currentScore The score AFTER the event points were added.
 * @returns The new EngagementState.
 */
export function determineNextState(
    currentState: EngagementState,
    event: EngagementEventType,
    currentScore: number
): EngagementState {

    // 1. Explicit Decline always leads to DECLINED (unless archived)
    if (event === EngagementEventType.INVITE_DECLINED) {
        if (currentState === EngagementState.ARCHIVED) return EngagementState.ARCHIVED;
        return EngagementState.DECLINED;
    }

    // 2. Explicit Acceptance (or signup) -> READY or ACTIVE
    if (event === EngagementEventType.INVITE_ACCEPTED) {
        return EngagementState.READY; // Or ACTIVE, depending on business logic. "Ready to onboard"
    }

    // 3. State-specific transitions
    switch (currentState) {
        case EngagementState.UNCONTACTED:
            // Any interaction moves to CONTACTED (usually "Email Sent" or "Page View" if they got the link)
            // Note: "Email Sent" isn't an engagement event in our types yet, but "Page View" is.
            // If we track "Email Sent" separately, we'd handle it. 
            // For now, if they VIEW the page, they are definitely CONTACTED (and potentially ENGAGED).
            if (currentScore > ENGAGEMENT_THRESHOLD) return EngagementState.ENGAGED;
            return EngagementState.CONTACTED;

        case EngagementState.CONTACTED:
            // If score crosses threshold, upgrade to ENGAGED
            if (currentScore >= ENGAGEMENT_THRESHOLD) {
                return EngagementState.ENGAGED;
            }
            return EngagementState.CONTACTED;

        case EngagementState.ENGAGED:
            // Can move to EVALUATING on high-intent actions (Manual trigger?)
            // For now, stay ENGAGED or drop back if score decays (though this function is called on EVENT, so score usually goes up)
            // If score drops below threshold (e.g. via decay fn elsewhere), it might revert to CONTACTED.
            // But this function handles "Next State after Event".
            return EngagementState.ENGAGED;

        case EngagementState.EVALUATING:
        case EngagementState.READY:
        case EngagementState.ACTIVE:
        case EngagementState.PAUSED:
        case EngagementState.DECLINED:
        case EngagementState.DORMANT:
        case EngagementState.ARCHIVED:
            // No automatic backward transitions from these states triggered by simple engagement events.
            // e.g. If DECLINED, opening an email doesn't make them ENGAGED again automatically (safety).
            return currentState;

        default:
            return currentState;
    }
}

/**
 * Validates if a manual state change is allowed.
 * Used for admin overrides.
 */
export function canManuallyTransition(from: EngagementState, to: EngagementState): boolean {
    // Admins can mostly do anything, but prevent silly mistakes.
    if (from === to) return true;

    // Prevent un-declining without care? No, admins need full power.
    return true;
}
