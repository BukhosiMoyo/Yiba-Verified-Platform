'use server';

import * as EventStore from '@/lib/outreach/engine/eventStore';
import * as StateMachine from '@/lib/outreach/engine/stateMachine';
import * as Scoring from '@/lib/outreach/engine/scoringEngine';
import * as TemplateVersioning from '@/lib/outreach/engine/templateVersioning';
import * as AIPipeline from '@/lib/outreach/engine/aiPipeline';
import { OutreachEventType, EngagementState, AIDraft, EmailTemplateStage, OutreachEvent } from '@/lib/outreach/types';

// ==========================================
// OUTREACH ENGINE ACTIONS
// These are the public entry points for the UI to interact with the engine.
// ==========================================

export async function getInstitutionTimeline(institutionId: string): Promise<OutreachEvent[]> {
    return EventStore.getInstitutionTimeline(institutionId);
}

export async function transitionStage(institutionId: string, eventType: OutreachEventType, metadata: any = {}) {
    return StateMachine.transitionEngagementState(institutionId, eventType, 'HUMAN', metadata);
}

export async function manualScoreUpdate(institutionId: string, eventType: OutreachEventType) {
    return Scoring.updateEngagementScore(institutionId, eventType);
}

export async function publishTemplate(stageId: string, content: { subject: string; body: string }, editorId: string) {
    return TemplateVersioning.publishTemplateVersion(stageId, content, editorId);
}

export async function generateAiDraft(institutionId: string, context: any, instructions: any): Promise<AIDraft> {
    const prompt = AIPipeline.buildAiPrompt('Institution', context, instructions); // TODO: fetch name
    return AIPipeline.generateDraft(institutionId, prompt, 'Standard System Prompt');
}

// Analytics Wrappers (Placeholder for real aggregations)
export async function getRealMetrics() {
    // In real implementation:
    // const sent = await prisma.outreachEvent.count({ where: { event_type: 'EMAIL_SENT' } });
    // ...
    return null; // Return null to signal "Use Mock Seeds" if we can't query
}
