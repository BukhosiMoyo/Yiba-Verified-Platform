
import { determineNextState } from '../stateMachine';
import { EngagementState, EngagementEventType, ENGAGEMENT_THRESHOLD } from '../types';

describe('State Machine Logic', () => {
    describe('determineNextState', () => {

        // 1. Explicit Actions
        it('should transition to DECLINED on INVITE_DECLINED event', () => {
            const newState = determineNextState(
                EngagementState.UNCONTACTED,
                EngagementEventType.INVITE_DECLINED,
                0
            );
            expect(newState).toBe(EngagementState.DECLINED);
        });

        it('should transition to READY on INVITE_ACCEPTED event', () => {
            const newState = determineNextState(
                EngagementState.UNCONTACTED,
                EngagementEventType.INVITE_ACCEPTED,
                100
            );
            expect(newState).toBe(EngagementState.READY);
        });

        // 2. Uncontacted Transitions
        it('should move from UNCONTACTED to CONTACTED on interaction (low score)', () => {
            const newState = determineNextState(
                EngagementState.UNCONTACTED,
                EngagementEventType.LANDING_PAGE_VIEWED,
                15 // Below threshold (30)
            );
            expect(newState).toBe(EngagementState.CONTACTED);
        });

        it('should move from UNCONTACTED to ENGAGED if score is high enough', () => {
            const newState = determineNextState(
                EngagementState.UNCONTACTED,
                EngagementEventType.LINK_CLICKED,
                ENGAGEMENT_THRESHOLD + 1
            );
            expect(newState).toBe(EngagementState.ENGAGED);
        });

        // 3. Contacted Transitions
        it('should move from CONTACTED to ENGAGED if score crosses threshold', () => {
            const newState = determineNextState(
                EngagementState.CONTACTED,
                EngagementEventType.EMAIL_OPENED,
                ENGAGEMENT_THRESHOLD // Exact match or greater
            );
            expect(newState).toBe(EngagementState.ENGAGED);
        });

        it('should stay CONTACTED if score is still low', () => {
            const newState = determineNextState(
                EngagementState.CONTACTED,
                EngagementEventType.EMAIL_OPENED,
                ENGAGEMENT_THRESHOLD - 5
            );
            expect(newState).toBe(EngagementState.CONTACTED);
        });

        // 4. Stability of terminal/advanced states
        it('should not automatically revert from ENGAGED on simple events', () => {
            const newState = determineNextState(
                EngagementState.ENGAGED,
                EngagementEventType.EMAIL_OPENED,
                ENGAGEMENT_THRESHOLD + 5
            );
            expect(newState).toBe(EngagementState.ENGAGED);
        });

        it('should not change state for ARCHIVED even if declined again (edge case)', () => {
            const newState = determineNextState(
                EngagementState.ARCHIVED,
                EngagementEventType.INVITE_DECLINED, // e.g. late click
                0
            );
            expect(newState).toBe(EngagementState.ARCHIVED);
        });
    });
});
