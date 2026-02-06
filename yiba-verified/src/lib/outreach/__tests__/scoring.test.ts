
import { calculateCurrentScore, calculateNewScore } from '../scoring';
import { EngagementEventType, MAX_SCORE } from '../types';
import { differenceInDays } from 'date-fns';
import { vi, describe, it, expect } from 'vitest';

// Mock date-fns to control time
vi.mock('date-fns', () => ({
    differenceInDays: vi.fn(),
}));

describe('Scoring Logic', () => {
    describe('calculateCurrentScore (Decay)', () => {
        it('should return raw score if no last interaction', () => {
            expect(calculateCurrentScore(50, null)).toBe(50);
        });

        it('should decay score over time (1 point per day)', () => {
            (differenceInDays as unknown as ReturnType<typeof vi.fn>).mockReturnValue(10); // 10 days passed
            // 50 - 10 = 40
            expect(calculateCurrentScore(50, new Date())).toBe(40);
        });

        it('should not decay below 0', () => {
            (differenceInDays as unknown as ReturnType<typeof vi.fn>).mockReturnValue(100); // 100 days passed
            // 50 - 100 = -50 -> clamped to 0
            expect(calculateCurrentScore(50, new Date())).toBe(0);
        });

        it('should clamp max score (sanity check)', () => {
            // If db somehow has 150, and 0 days passed, should return MAX_SCORE (100)
            (differenceInDays as unknown as ReturnType<typeof vi.fn>).mockReturnValue(0);
            expect(calculateCurrentScore(150, new Date())).toBe(MAX_SCORE);
        });
    });

    describe('calculateNewScore (Addition)', () => {
        it('should add points for an event', () => {
            // Start with 50, add EMAIL_OPENED (5 points)
            expect(calculateNewScore(50, EngagementEventType.EMAIL_OPENED)).toBe(55);
        });

        it('should add points for distinct event types', () => {
            // INVITE_ACCEPTED = 50 points
            expect(calculateNewScore(10, EngagementEventType.INVITE_ACCEPTED)).toBe(60);
        });

        it('should clamp at MAX_SCORE', () => {
            // 95 + 10 (LINK_CLICKED) = 105 -> 100
            expect(calculateNewScore(95, EngagementEventType.LINK_CLICKED)).toBe(MAX_SCORE);
        });

        it('should handle negative points (e.g. DECLINE)', () => {
            // DECLINED is -50
            // 50 + (-50) = 0
            expect(calculateNewScore(50, EngagementEventType.INVITE_DECLINED)).toBe(0);
        });
    });
});
