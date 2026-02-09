import { prisma } from "@/lib/prisma";
import { SandboxSession, SandboxEvent, SandboxMessage } from "./types";
import { determineNextState } from "../stateMachine";
import { calculateNewScore, calculateCurrentScore } from "../scoring";
import { buildAiPrompt, generateDraft } from "../engine/aiPipeline";
import { OutreachEventType, EngagementState } from "../types";

/**
 * Creates a new sandbox session.
 */
export async function createSession(name: string, userId: string, institutionName: string = "Acme University", contactName?: string): Promise<SandboxSession> {
    // @ts-ignore - Prisma might generate types slowly
    const session = await prisma.outreachSandboxSession.create({
        data: {
            name,
            created_by_user_id: userId,
            institution_name: institutionName,
            contact_name: contactName,
            province: "Gauteng", // Default for simulation context
            current_stage: EngagementState.UNCONTACTED,
            engagement_score: 0,
            ai_enabled: true
        }
    });

    // Generate initial draft for "Unaware" stage
    await generateSandboxDraft(session.session_id);

    return session;
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
    // Cast to any to bypass strict enum mismatch for now (Logic Gap identified in api.ts)
    const newScore = calculateNewScore(effectiveScore, eventType as any);

    // 3. Determine New State (Pure Logic Reuse)
    const newState = determineNextState(
        session.current_stage as EngagementState,
        eventType as any, // Cast to bypass enum mismatch
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

    // 2. Fetch Relevant Questionnaire (Mock Logic for Sandbox)
    const STATE_TO_SLUG: Partial<Record<string, string>> = {
        [EngagementState.UNCONTACTED]: "unaware-check-in",
        [EngagementState.CONTACTED]: "problem-aware-challenges",
        [EngagementState.ENGAGED]: "solution-aware-needs",
        [EngagementState.EVALUATING]: "trust-aware-action",
        [EngagementState.READY]: "trust-aware-action",
    };
    const slug = STATE_TO_SLUG[session.current_stage as EngagementState];
    let questionnaireContext = "No specific questionnaire.";

    if (slug) {
        const q = await prisma.questionnaire.findUnique({
            where: { slug }
        });
        if (q) {
            // @ts-ignore
            const questions = q.steps.flatMap(s => s.questions.map(qu => qu.text)).join("\n- ");
            questionnaireContext = `Relevant Questionnaire (${q.title}):\n${q.description}\nQuestions we want answered:\n- ${questions}`;
        }
    }

    // 3. Conditional: Use Hardcoded Template for "UNCONTACTED"
    // This overrides the AI/Mock engine to match user preference exactly for the initial hook.
    if (session.current_stage === EngagementState.UNCONTACTED) {
        const provinceText = session.province && session.province !== "Unknown" ? session.province : "local";
        const greetingName = session.contact_name ? session.contact_name : session.institution_name;

        const emailBody = `Hi ${greetingName},

We noticed that you are a key player in the ${provinceText} education sector, but currently handle your accreditation manually.

Yiba Verified is the new standard platform designed to streamline your QCTO compliance.

Would you be open to a 10-minute demo to see how we automate submissions?`;

        // @ts-ignore
        return prisma.outreachSandboxMessage.create({
            data: {
                session_id: sessionId,
                subject: "Partnership Opportunity: Streamline QCTO Compliance", // Fitting subject for the body
                body_html: emailBody.replace(/\n/g, '<br/>'), // Simple HTML conversion
                status: 'DRAFT',
                from_name: 'Yiba Team',
                ai_draft_id: `template_uncontacted_${Date.now()}`
            }
        });
    }

    // 4. Build Prompt (Pure Logic Reuse)
    const prompt = buildAiPrompt(
        session.institution_name,
        {
            stage: session.current_stage,
            score: session.engagement_score,
            questionnaire_goal: questionnaireContext
        },
        { tone: "Professional", references: [], forbidden_content: ["Guaranteed funding"] } // Mock policy
    );

    // 4. Generate Draft (Service Reuse)
    const draft = await generateDraft("sandbox_" + sessionId, prompt, "System Prompt");

    // 5. Save to Sandbox Message (Persistence)
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

    // Generate initial draft for "Unaware" (Uncontacted) stage
    await generateSandboxDraft(sessionId);
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
