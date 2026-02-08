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

// ==========================================
// DB PRE-CHECK FOR DUPLICATES
// ==========================================

import { prisma } from '@/lib/prisma';

export async function checkDuplicates(leads: any[]): Promise<{ existingCount: number, newCount: number }> {
    if (!leads || leads.length === 0) return { existingCount: 0, newCount: 0 };

    const emails = leads.map(l => l.email?.toLowerCase()).filter(Boolean);
    const names = leads.map(l => l.organization || l.institution_name).filter(Boolean);

    // 1. Resolve Institutions (Only check names present in CSV)
    // The import route logic matches on `legal_name`.
    const existingInsts = await prisma.institution.findMany({
        where: { legal_name: { in: names } },
        select: { institution_id: true, legal_name: true }
    });

    const instMap = new Map();
    existingInsts.forEach(i => {
        if (i.legal_name) instMap.set(i.legal_name.toLowerCase(), i.institution_id);
    });

    // 2. Fetch Existing Invites for these emails
    // We fetch ALL invites for these emails, then locally filter by institution
    const existingInvites = await prisma.invite.findMany({
        where: { email: { in: emails } },
        select: { email: true, institution_id: true }
    });

    const existingKeys = new Set(
        existingInvites.map(inv => `${inv.email.toLowerCase()}|${inv.institution_id}`)
    );

    let existingCount = 0;
    let newCount = 0;

    for (const lead of leads) {
        const email = lead.email?.toLowerCase();
        const orgName = (lead.organization || lead.institution_name)?.toLowerCase();

        if (!email) continue;

        // Try to resolve Institution ID from Name
        const instId = instMap.get(orgName);

        if (instId) {
            // Check if this specific Email + Institution combo exists in Invites
            if (existingKeys.has(`${email}|${instId}`)) {
                existingCount++;
            } else {
                newCount++;
            }
        } else {
            // If Institution doesn't exist, this is definitely a new Lead (creates new Inst + new Invite)
            newCount++;
        }
    }

    return { existingCount, newCount };
}
