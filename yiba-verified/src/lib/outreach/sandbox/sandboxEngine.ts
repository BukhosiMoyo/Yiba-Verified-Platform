import { prisma } from "@/lib/prisma";
import { SandboxSession, SandboxEvent, SandboxMessage } from "./types";
import { determineNextState } from "../stateMachine";
import { calculateNewScore, calculateCurrentScore } from "../scoring";
import { buildAiPrompt, generateDraft } from "../engine/aiPipeline";
import { OutreachEventType, EngagementState } from "../types";

/**
 * Creates a new sandbox session.
 */
export async function createSession(name: string, userId: string, institutionName: string = "Acme University"): Promise<SandboxSession> {
    // @ts-ignore - Prisma might generate types slowly
    return prisma.outreachSandboxSession.create({
        data: {
            name,
            created_by_user_id: userId,
            institution_name: institutionName,
            current_stage: EngagementState.UNCONTACTED,
            engagement_score: 0,
            ai_enabled: true
        }
    });
}

/**
 * Triggers a simulated event in the sandbox.
 * Reuses the CORE STATE MACHINE logic.
 */
export async function triggerSandboxEvent(
    sessionId: string,
    eventType: OutreachEventType,
    metadata: any = {}
): Promise<SandboxSession> {

    // 1. Fetch Session
    // @ts-ignore
    const session = await prisma.outreachSandboxSession.findUnique({
        where: { session_id: sessionId }
    });
    if (!session) throw new Error("Session not found");

    // 2. Calculate New Score (Pure Logic Reuse)
    const effectiveScore = calculateCurrentScore(session.engagement_score, session.last_activity_at);
    const newScore = calculateNewScore(effectiveScore, eventType);

    // 3. Determine New State (Pure Logic Reuse)
    const newState = determineNextState(
        session.current_stage as EngagementState,
        eventType,
        newScore
    );

    // 4. Update Session (Persistence)
    // @ts-ignore
    const updatedSession = await prisma.outreachSandboxSession.update({
        where: { session_id: sessionId },
        data: {
            current_stage: newState,
            engagement_score: newScore,
            last_activity_at: new Date()
        }
    });

    // 5. Log Event
    // @ts-ignore
    await prisma.outreachSandboxEvent.create({
        data: {
            session_id: sessionId,
            event_type: eventType,
            metadata: { ...metadata, scoreDelta: newScore - effectiveScore, fromStage: session.current_stage, toStage: newState },
            description: metadata.description
        }
    });

    return updatedSession;
}

/**
 * Generates a draft email using the AI pipeline (reused).
 * Stores it in OutreachSandboxMessage.
 */
export async function generateSandboxDraft(sessionId: string): Promise<SandboxMessage> {
    // 1. Fetch Session
    // @ts-ignore
    const session = await prisma.outreachSandboxSession.findUnique({ where: { session_id: sessionId } });
    if (!session) throw new Error("Session not found");

    // 2. Build Prompt (Pure Logic Reuse)
    const prompt = buildAiPrompt(
        session.institution_name,
        { stage: session.current_stage, score: session.engagement_score },
        { tone: "Professional", references: [], forbidden_content: ["Guaranteed funding"] } // Mock policy
    );

    // 3. Generate Draft (Service Reuse)
    // Note: In real world, we might mock the LLM call itself for sandbox cost savings, 
    // but the requirement says "generate next message exactly like production would".
    const draft = await generateDraft("sandbox_" + sessionId, prompt, "System Prompt");

    // 4. Save to Sandbox Message (Persistence)
    // @ts-ignore
    return prisma.outreachSandboxMessage.create({
        data: {
            session_id: sessionId,
            subject: draft.subject,
            body_html: draft.body,
            status: 'DRAFT',
            from_name: 'Yiba Team',
            ai_draft_id: draft.draft_id
        }
    });
}

/**
 * Resets a session to initial state.
 */
export async function resetSession(sessionId: string): Promise<void> {
    // @ts-ignore
    await prisma.$transaction([
        prisma.outreachSandboxEvent.deleteMany({ where: { session_id: sessionId } }),
        prisma.outreachSandboxMessage.deleteMany({ where: { session_id: sessionId } }),
        prisma.outreachSandboxSession.update({
            where: { session_id: sessionId },
            data: {
                current_stage: EngagementState.UNCONTACTED,
                engagement_score: 0
            }
        })
    ]);
}

/**
 * Forces a conversion state (Sandbox only).
 */
export async function convertSession(sessionId: string): Promise<void> {
    // @ts-ignore
    await prisma.$transaction([
        prisma.outreachSandboxSession.update({
            where: { session_id: sessionId },
            data: { current_stage: 'CONVERTED' } // forcing string or Enum if available
        }),
        prisma.outreachSandboxEvent.create({
            data: {
                session_id: sessionId,
                event_type: 'CONVERTED', // check if in Enum, else logic might break if we use strict enum
                metadata: { description: "Simulated conversion via Admin Sandbox" }
            }
        })
    ]);
}
