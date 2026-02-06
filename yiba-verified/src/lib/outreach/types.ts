import { EngagementState } from "@prisma/client";

/**
 * Re-export EngagementState for convenience to avoid importing from @prisma/client everywhere.
 * Or we can just use the Prisma one directly.
 */
export { EngagementState };

/**
 * Events that influence the engagement score.
 * Each event type has a specific point value.
 */
export enum EngagementEventType {
    EMAIL_OPENED = "EMAIL_OPENED",
    LINK_CLICKED = "LINK_CLICKED",
    LANDING_PAGE_VIEWED = "LANDING_PAGE_VIEWED",
    INVITE_ACCEPTED = "INVITE_ACCEPTED",
    INVITE_DECLINED = "INVITE_DECLINED",
    MANUAL_INTERVENTION = "MANUAL_INTERVENTION",
}

/**
 * Structure of a single entry in the engagement history log.
 */
export interface EngagementHistoryEntry {
    timestamp: string; // ISO string
    event: EngagementEventType | string; // Allow string for custom events
    scoreDelta: number;
    newState?: EngagementState;
    metadata?: Record<string, any>;
}

/**
 * Constants for scoring logic.
 * These should match the Strategy Document.
 */
export const SCORING_POINTS: Record<EngagementEventType, number> = {
    [EngagementEventType.EMAIL_OPENED]: 5,
    [EngagementEventType.LINK_CLICKED]: 10,
    [EngagementEventType.LANDING_PAGE_VIEWED]: 15,
    [EngagementEventType.INVITE_ACCEPTED]: 50, // Should probably transition state immediately
    [EngagementEventType.INVITE_DECLINED]: -50, // Should transition to DECLINED
    [EngagementEventType.MANUAL_INTERVENTION]: 0,
};

export const MAX_SCORE = 100;
export const DECAY_RATE_PER_DAY = 1; // Points lost per day of inactivity
export const ENGAGEMENT_THRESHOLD = 30; // Score required to be considered "ENGAGED"
