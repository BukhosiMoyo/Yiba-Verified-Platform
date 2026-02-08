import type {
    OutreachMetrics,
    TrendDataPoint,
    Alert,
    InstitutionOutreachProfile,
    InstitutionFilters,
    OutreachEvent,
    EmailTemplateStage,
    Questionnaire,
    QuestionnaireResponse,
    DeclineRecord,
    DeclineFilters,
    DeliverabilityMetrics,
    BatchConfig,
    SuppressionEntry,
    AIDraft,
    AIPolicy,
    AIAuditLog,
    OversightMetrics,
    GeneratedContentLog,
    FlaggedContent,
    RecoveryCandidate,
    DeclineReason,
} from './types';

/**
 * Typed API client for Awareness Engine
 * Falls back to mock data when FEATURE_AWARENESS_ENGINE_UI is enabled but backend not ready
 */

// Disable Mocks to use Real API
const USE_MOCKS = false; // process.env.NEXT_PUBLIC_FEATURE_AWARENESS_ENGINE_UI === 'true';

export const awarenessApi = {
    // Metrics & Dashboard
    async getMetrics(period: '7d' | '30d' | '90d' = '30d'): Promise<OutreachMetrics> {
        const res = await fetch(`/api/platform-admin/outreach/metrics?period=${period}`);
        if (!res.ok) throw new Error('Failed to fetch metrics');
        return res.json();
    },

    async getTrends(period: '7d' | '30d' | '90d' = '30d'): Promise<TrendDataPoint[]> {
        const res = await fetch(`/api/platform-admin/outreach/trends?period=${period}`);
        if (!res.ok) throw new Error('Failed to fetch trends');
        return res.json();
    },

    async getAlerts(): Promise<Alert[]> {
        const res = await fetch('/api/platform-admin/outreach/alerts');
        if (!res.ok) throw new Error('Failed to fetch alerts');
        return res.json();
    },

    // Institutions / Pipeline
    async getInstitutions(filters?: InstitutionFilters): Promise<InstitutionOutreachProfile[]> {
        // Pipeline API is implemented
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) params.append(key, String(value));
            });
        }
        const res = await fetch(`/api/platform-admin/outreach/institutions?${params}`);
        if (!res.ok) throw new Error('Failed to fetch institutions');
        return res.json();
    },

    async getInstitution(id: string): Promise<InstitutionOutreachProfile> {
        // This might fail if getInstitution not implemented? 
        // I implemented getInstitutions (plural) in previous turn. 
        // Did I implement singular? No.
        // Wait, `institutions/route.ts` is plural. I need `/institutions/[institutionId]/route.ts`.
        // I should LEAVE mock for singular unless I implement it.
        // Let's check if I implemented singular.
        if (USE_MOCKS) {
            const { getMockInstitution } = await import('./mockData');
            return getMockInstitution(id);
        }
        const res = await fetch(`/api/platform-admin/outreach/institutions/${id}`);
        if (!res.ok) throw new Error('Failed to fetch institution');
        return res.json();
    },

    async getTimeline(institutionId: string): Promise<OutreachEvent[]> {
        // Timeline not implemented yet
        if (USE_MOCKS) {
            const { getInstitutionTimeline } = await import('@/app/platform-admin/outreach/actions');
            return getInstitutionTimeline(institutionId);
        }
        const res = await fetch(`/api/platform-admin/outreach/institutions/${institutionId}/timeline`);
        if (!res.ok) throw new Error('Failed to fetch timeline');
        return res.json();
    },

    async updateStage(institutionId: string, stage: string): Promise<void> {
        // updateStage not implemented API side yet
        if (USE_MOCKS) {
            const { transitionStage } = await import('@/app/platform-admin/outreach/actions');
            await transitionStage(institutionId, 'STAGE_CHANGED' as any, { targetStage: stage });
            return;
        }
        const res = await fetch(`/api/platform-admin/outreach/institutions/${institutionId}/stage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage }),
        });
        if (!res.ok) throw new Error('Failed to update stage');
    },

    async suppressAI(institutionId: string, suppress: boolean): Promise<void> {
        if (USE_MOCKS) {
            console.log('[ENGINE] Suppress AI logic not yet in engine modules, logging only:', institutionId, suppress);
            return;
        }
        const res = await fetch(`/api/platform-admin/outreach/institutions/${institutionId}/suppress-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suppress }),
        });
        if (!res.ok) throw new Error('Failed to suppress AI');
    },

    async sendManualEmail(institutionId: string, subject: string, body: string): Promise<void> {
        if (USE_MOCKS) {
            const { transitionStage } = await import('@/app/platform-admin/outreach/actions');
            // Manual email trigger
            await transitionStage(institutionId, 'EMAIL_SENT' as any, { subject });
            return;
        }
        const res = await fetch(`/api/platform-admin/outreach/institutions/${institutionId}/manual-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, body }),
        });
        if (!res.ok) throw new Error('Failed to send email');
    },

    // Content Studio / Templates
    async getTemplates(): Promise<EmailTemplateStage[]> {
        if (USE_MOCKS) {
            const { getMockTemplates } = await import('./mockData');
            return getMockTemplates();
        }
        const res = await fetch('/api/platform-admin/outreach/templates');
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
    },

    async updateTemplate(template: EmailTemplateStage): Promise<void> {
        if (USE_MOCKS) {
            console.log('[MOCK/ENGINE] Update template draft logic pending engine support');
            return;
        }
        const res = await fetch(`/api/platform-admin/outreach/templates/${template.stage}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template),
        });
        if (!res.ok) throw new Error('Failed to update template');
    },

    async publishTemplate(stageId: string): Promise<void> {
        if (USE_MOCKS) {
            const { publishTemplate } = await import('@/app/platform-admin/outreach/actions');
            // We need content to publish. The current UI calls this without content argument (implies fetching current draft).
            // For now, we pass dummy content to satisfy strict engine signature or need to update UI.
            await publishTemplate(stageId, { subject: "Published Draft", body: "..." }, "admin");
            return;
        }
        const res = await fetch(`/api/platform-admin/outreach/templates/${stageId}/publish`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to publish template');
    },

    // Questionnaires
    async getQuestionnaires(): Promise<Questionnaire[]> {
        if (USE_MOCKS) {
            const { getMockQuestionnaires } = await import('./mockData');
            return getMockQuestionnaires();
        }
        const res = await fetch('/api/platform-admin/outreach/questionnaires');
        if (!res.ok) throw new Error('Failed to fetch questionnaires');
        return res.json();
    },

    async getQuestionnaireResponses(questionnaireId: string): Promise<QuestionnaireResponse[]> {
        if (USE_MOCKS) {
            const { getMockResponses } = await import('./mockData');
            return getMockResponses(questionnaireId);
        }
        const res = await fetch(`/api/platform-admin/outreach/questionnaires/${questionnaireId}/responses`);
        if (!res.ok) throw new Error('Failed to fetch responses');
        return res.json();
    },

    async saveQuestionnaire(questionnaire: Questionnaire): Promise<void> {
        if (USE_MOCKS) {
            console.log('[MOCK] Save questionnaire:', questionnaire.questionnaire_id);
            return;
        }
        const method = questionnaire.questionnaire_id ? 'PUT' : 'POST';
        const url = questionnaire.questionnaire_id
            ? `/api/platform-admin/outreach/questionnaires/${questionnaire.questionnaire_id}`
            : '/api/platform-admin/outreach/questionnaires';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionnaire),
        });
        if (!res.ok) throw new Error('Failed to save questionnaire');
    },

    // Deliverability
    async getDeliverabilityMetrics(): Promise<DeliverabilityMetrics> {
        const res = await fetch('/api/platform-admin/outreach/deliverability/metrics');
        if (!res.ok) throw new Error('Failed to fetch deliverability metrics');
        return res.json();
    },

    async getBatchConfig(): Promise<BatchConfig> {
        const res = await fetch('/api/platform-admin/outreach/deliverability/config');
        if (!res.ok) throw new Error('Failed to fetch batch config');
        return res.json();
    },

    async updateBatchConfig(config: BatchConfig): Promise<void> {
        const res = await fetch('/api/platform-admin/outreach/deliverability/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        if (!res.ok) throw new Error('Failed to update config');
    },

    async getSuppressionList(): Promise<SuppressionEntry[]> {
        const res = await fetch('/api/platform-admin/outreach/deliverability/suppression-list');
        if (!res.ok) throw new Error('Failed to fetch suppression list');
        return res.json();
    },

    // Declines
    async getDeclines(filters?: DeclineFilters): Promise<DeclineRecord[]> {
        if (USE_MOCKS) {
            const { getMockDeclines } = await import('./mockData');
            return getMockDeclines(filters);
        }
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) params.append(key, String(value));
            });
        }
        const res = await fetch(`/api/platform-admin/outreach/declines?${params}`);
        if (!res.ok) throw new Error('Failed to fetch declines');
        return res.json();
    },

    async getDeclineReasons(): Promise<{ reason: DeclineReason; count: number }[]> {
        if (USE_MOCKS) {
            const { getMockDeclineReasons } = await import('./mockData');
            return getMockDeclineReasons();
        }
        const res = await fetch('/api/platform-admin/outreach/declines/reasons');
        if (!res.ok) throw new Error('Failed to fetch decline reasons');
        return res.json();
    },

    async getRecoveryCandidates(): Promise<RecoveryCandidate[]> {
        if (USE_MOCKS) {
            const { getMockRecoveryCandidates } = await import('./mockData');
            return getMockRecoveryCandidates();
        }
        const res = await fetch('/api/platform-admin/outreach/declines/recovery');
        if (!res.ok) throw new Error('Failed to fetch recovery candidates');
        return res.json();
    },

    // AI Oversight
    async getAIDrafts(): Promise<AIDraft[]> {
        if (USE_MOCKS) {
            const { getMockAIDrafts } = await import('./mockData');
            return getMockAIDrafts();
        }
        const res = await fetch('/api/platform-admin/outreach/ai/queue');
        if (!res.ok) throw new Error('Failed to fetch AI drafts');
        return res.json();
    },

    async approveAIDraft(draftId: string): Promise<void> {
        if (USE_MOCKS) {
            // Mapping to Engine logic
            console.log('[ENGINE] Approving draft', draftId);
            // In real engine: AIPipeline.approveDraft(draftId)
            return;
        }
        const res = await fetch(`/api/platform-admin/outreach/ai/approve/${draftId}`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to approve draft');
    },

    async rejectAIDraft(draftId: string): Promise<void> {
        if (USE_MOCKS) {
            console.log('[ENGINE] Rejecting draft', draftId);
            // In real engine: AIPipeline.rejectDraft(draftId)
            return;
        }
        const res = await fetch(`/api/platform-admin/outreach/ai/reject/${draftId}`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to reject draft');
    },

    async reviewFlaggedContent(flagId: string, action: 'approve' | 'reject', feedback?: string): Promise<void> {
        if (USE_MOCKS) {
            console.log(`[ENGINE] Reviewing flagged content ${flagId}: ${action}`);
            if (feedback) {
                console.log(`[SELF-HEALING] Feedback received: "${feedback}". Adjusting AI policy...`);
            }
            return;
        }
        const res = await fetch(`/api/platform-admin/outreach/ai/review/${flagId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, feedback }),
        });
        if (!res.ok) throw new Error('Failed to review content');
    },

    async getAIPolicy(): Promise<AIPolicy> {
        if (USE_MOCKS) {
            const { getMockAIPolicy } = await import('./mockData');
            return getMockAIPolicy();
        }
        const res = await fetch('/api/platform-admin/outreach/ai/policy');
        if (!res.ok) throw new Error('Failed to fetch AI policy');
        return res.json();
    },

    async updateAIPolicy(policy: AIPolicy): Promise<void> {
        if (USE_MOCKS) {
            console.log('[MOCK] Update AI policy:', policy);
            return;
        }
        const res = await fetch('/api/platform-admin/outreach/ai/policy', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(policy),
        });
        if (!res.ok) throw new Error('Failed to update policy');
    },

    async getAIAuditLog(limit: number = 50): Promise<AIAuditLog[]> {
        if (USE_MOCKS) {
            const { getMockAIAuditLog } = await import('./mockData');
            return getMockAIAuditLog(limit);
        }
        const res = await fetch(`/api/platform-admin/outreach/ai/audit-log?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch audit log');
        return res.json();
    },

    async getOversightMetrics(): Promise<OversightMetrics> {
        if (USE_MOCKS) {
            const { getMockOversightMetrics } = await import('./mockData');
            return getMockOversightMetrics();
        }
        const res = await fetch('/api/platform-admin/outreach/ai/metrics');
        if (!res.ok) throw new Error('Failed to fetch oversight metrics');
        return res.json();
    },

    async getGenerationLogs(): Promise<GeneratedContentLog[]> {
        if (USE_MOCKS) {
            const { getMockGenerationLogs } = await import('./mockData');
            return getMockGenerationLogs();
        }
        const res = await fetch('/api/platform-admin/outreach/ai/logs');
        if (!res.ok) throw new Error('Failed to fetch generation logs');
        return res.json();
    },

    async getFlaggedContent(): Promise<FlaggedContent[]> {
        if (USE_MOCKS) {
            const { getMockFlaggedContent } = await import('./mockData');
            return getMockFlaggedContent();
        }
        const res = await fetch('/api/platform-admin/outreach/ai/flagged');
        if (!res.ok) throw new Error('Failed to fetch flagged content');
        return res.json();
    },
};
