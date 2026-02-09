import { SandboxSession, SandboxMessage } from "@/lib/outreach/sandbox/types";
import { getSandboxSession } from "../actions";
import { WorkspaceClient } from "../_components/WorkspaceClient";
import { Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-black overflow-hidden">
            {/* Context Header */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Terminal className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Outreach Intelligence</div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Sandbox Explorer</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Instance</div>
                        <div className="text-sm font-bold text-slate-600 dark:text-slate-300">{sessionData.institution_name}</div>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 font-black text-[10px] tracking-widest py-1 px-3">
                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse mr-2" />
                        LIVE SYNC
                    </Badge>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <WorkspaceClient
                    session={serializedData}
                    messages={serializedData.messages}
                    events={serializedData.events}
                    questionnaire={serializedQuestionnaire}
                />
            </div>
        </div>
    );
}
