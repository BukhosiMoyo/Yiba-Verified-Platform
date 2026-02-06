import { differenceInDays } from "date-fns";
import {
    EngagementEventType,
    SCORING_POINTS,
    MAX_SCORE,
    DECAY_RATE_PER_DAY
} from "./types";

/**
 * Calculates the effective score by applying time-based decay to the raw score.
 * Formula: Effective Score = Raw Score - (Days Since Last Interaction * Decay Rate)
 * Minimum score is always 0.
 * 
 * @param rawScore The stored raw score from the database.
 * @param lastInteractionAt The timestamp of the last interaction.
 * @returns The current effective score (0 to MAX_SCORE).
 */
export function calculateCurrentScore(rawScore: number, lastInteractionAt: Date | null): number {
    if (!lastInteractionAt) {
        return Math.max(0, Math.min(rawScore, MAX_SCORE));
    }

    const now = new Date();
    const daysSince = Math.max(0, differenceInDays(now, lastInteractionAt));
    const decayAmount = daysSince * DECAY_RATE_PER_DAY;

    const effectiveScore = rawScore - decayAmount;

    // Clamp between 0 and MAX_SCORE
    return Math.max(0, Math.min(effectiveScore, MAX_SCORE));
}

/**
 * Calculates the new raw score after an engagement event.
 * Note: This function returns the NEW RAW SCORE to be saved to the DB.
 * When saving, you should also update `last_interaction_at` to NOW.
 * 
 * @param currentEffectiveScore The score AFTER decay (calculated via calculateCurrentScore).
 * @param eventType The type of engagement event (e.g. OPENed, CLICKed).
 * @returns The new raw score to save to the database.
 */
export function calculateNewScore(currentEffectiveScore: number, eventType: EngagementEventType): number {
    const points = SCORING_POINTS[eventType] || 0;
    const newScore = currentEffectiveScore + points;

    return Math.max(0, Math.min(newScore, MAX_SCORE));
}
