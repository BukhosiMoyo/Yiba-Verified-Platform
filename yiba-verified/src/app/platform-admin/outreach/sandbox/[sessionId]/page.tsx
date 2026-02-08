import { SandboxSession, SandboxMessage } from "@/lib/outreach/sandbox/types";
import { getSandboxSession } from "../actions";
import { WorkspaceClient } from "../_components/WorkspaceClient";

import { prisma } from "@/lib/prisma";
import { EngagementState } from "@prisma/client";

// Mapping from Stage to Questionnaire Slug
const STATE_TO_SLUG: Partial<Record<string, string>> = {
    [EngagementState.UNCONTACTED]: "unaware-check-in",
    [EngagementState.CONTACTED]: "problem-aware-challenges",
    [EngagementState.ENGAGED]: "solution-aware-needs",
    [EngagementState.EVALUATING]: "trust-aware-action",
    [EngagementState.READY]: "trust-aware-action",
};

export default async function SandboxWorkspace({ params }: { params: Promise<{ sessionId: string }> }) {
    // 0. Await params (Next.js 15+)
    const { sessionId } = await params;

    // 1. Fetch Real Data
    const sessionData = await getSandboxSession(sessionId);

    if (!sessionData) return <div>Session not found</div>;

    // 2. Fetch Questionnaire for this stage
    let activeQuestionnaire = null;
    const currentStage = sessionData.current_stage as EngagementState; // Type assertion since SandboxSession uses string
    const slug = STATE_TO_SLUG[currentStage];

    if (slug) {
        activeQuestionnaire = await prisma.questionnaire.findUnique({
            where: { slug },
            // Include steps/questions if not fetched by default, but findUnique usually fetches scalars. 
            // The type definition implies steps are JSON or related.
            // Prisma schema for Questionnaire has 'steps Json'.
        });
    }

    // 3. Deep Serialize
    const serializedData = JSON.parse(JSON.stringify(sessionData));
    const serializedQuestionnaire = activeQuestionnaire ? JSON.parse(JSON.stringify(activeQuestionnaire)) : null;

    // 4. Render Client Wrapper
    return (
        <WorkspaceClient
            session={serializedData}
            messages={serializedData.messages}
            events={serializedData.events}
            questionnaire={serializedQuestionnaire}
        />
    );
}
