import {
    OutreachEventType,
    TemplateStatus,
    QuestionType,
    EngagementStage,
    DeclineReason,
} from './types';

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
} from './types';

// Mock data for Awareness Engine UI development

export function getMockMetrics(): OutreachMetrics {
    return {
        sent: 1250,
        delivered: 1198,
        opened: 487,
        clicked: 193,
        responses: 82,
        signups: 34,
        declines: 18,
        conversion_rate: 2.72,
        avg_time_to_signup_hours: 127,
    };
}

export function getMockTrends(): TrendDataPoint[] {
    const data: TrendDataPoint[] = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toISOString().split('T')[0],
            opens: Math.floor(Math.random() * 30) + 10,
            clicks: Math.floor(Math.random() * 15) + 5,
            signups: Math.floor(Math.random() * 3),
        });
    }
    return data;
}

export function getMockAlerts(): Alert[] {
    return [
        {
            alert_id: 'alert_1',
            type: 'DELIVERABILITY_DIP',
            severity: 'MEDIUM',
            message: 'Open rate dropped 15% in last 48 hours',
            timestamp: new Date(Date.now() - 3600000 * 5),
            acknowledged: false,
        },
        {
            alert_id: 'alert_2',
            type: 'HIGH_DECLINES',
            severity: 'HIGH',
            message: '12 declines in past week - review messaging',
            timestamp: new Date(Date.now() - 3600000 * 24),
            acknowledged: false,
        },
    ];
}

export function getMockInstitutions(filters?: InstitutionFilters): InstitutionOutreachProfile[] {
    const allInstitutions: InstitutionOutreachProfile[] = [
        {
            institution_id: 'inst_1',
            institution_name: 'Tech Skills Academy',
            domain: 'techskills.ac.za',
            province: 'Gauteng',
            engagement_stage: 'PROBLEM_AWARE' as EngagementStage,
            engagement_score: 45,
            last_activity: new Date(Date.now() - 3600000 * 12),
            next_scheduled_step: new Date(Date.now() + 3600000 * 36),
            status_flags: {
                bounced: false,
                opt_out: false,
                declined: false,
                ai_suppressed: false,
            },
            contacts: [
                {
                    contact_id: 'contact_1',
                    email: 'admin@techskills.ac.za',
                    first_name: 'Sarah',
                    last_name: 'Ndlovu',
                    role: 'Director',
                    primary: true,
                },
            ],
        },
        {
            institution_id: 'inst_2',
            institution_name: 'Future Leaders Institute',
            domain: 'futureleaders.co.za',
            province: 'Western Cape',
            engagement_stage: 'TRUST_AWARE' as EngagementStage,
            engagement_score: 72,
            last_activity: new Date(Date.now() - 3600000 * 6),
            next_scheduled_step: new Date(Date.now() + 3600000 * 18),
            status_flags: {
                bounced: false,
                opt_out: false,
                declined: false,
                ai_suppressed: false,
            },
            contacts: [
                {
                    contact_id: 'contact_2',
                    email: 'contact@futureleaders.co.za',
                    first_name: 'John',
                    last_name: 'van der Merwe',
                    role: 'CEO',
                    primary: true,
                },
            ],
        },
        {
            institution_id: 'inst_3',
            institution_name: 'Skills Development Hub',
            domain: 'skillshub.org.za',
            province: 'KwaZulu-Natal',
            engagement_stage: 'UNAWARE' as EngagementStage,
            engagement_score: 0,
            last_activity: new Date(Date.now() - 3600000 * 120),
            next_scheduled_step: new Date(Date.now() + 3600000 * 72),
            status_flags: {
                bounced: false,
                opt_out: false,
                declined: false,
                ai_suppressed: false,
            },
            contacts: [
                {
                    contact_id: 'contact_3',
                    email: 'info@skillshub.org.za',
                    first_name: 'Thandiwe',
                    last_name: 'Mthembu',
                    role: 'Admin',
                    primary: true,
                },
            ],
        },
    ];

    return allInstitutions;
}

export function getMockInstitution(id: string): InstitutionOutreachProfile {
    const institutions = getMockInstitutions();
    return institutions.find(i => i.institution_id === id) || institutions[0];
}

export function getMockTimeline(institutionId: string): OutreachEvent[] {
    return [
        {
            event_id: 'event_1',
            institution_id: institutionId,
            event_type: OutreachEventType.EMAIL_SENT,
            timestamp: new Date(Date.now() - 3600000 * 72),
            metadata: { stage: 'UNAWARE', template: 'initial_awareness' },
            triggered_by: 'SYSTEM',
            description: 'Initial awareness email sent',
        },
        {
            event_id: 'event_2',
            institution_id: institutionId,
            event_type: OutreachEventType.EMAIL_OPENED,
            timestamp: new Date(Date.now() - 3600000 * 60),
            metadata: { user_agent: 'Mozilla/5.0...' },
            triggered_by: 'SYSTEM',
            description: 'Email opened',
        },
        {
            event_id: 'event_3',
            institution_id: institutionId,
            event_type: OutreachEventType.LINK_CLICKED,
            timestamp: new Date(Date.now() - 3600000 * 48),
            metadata: { url: 'https://yibaverified.co.za/learn-more' },
            triggered_by: 'SYSTEM',
            description: 'Clicked "Learn More" link',
        },
        {
            event_id: 'event_4',
            institution_id: institutionId,
            event_type: OutreachEventType.STAGE_CHANGED,
            timestamp: new Date(Date.now() - 3600000 * 36),
            metadata: { from_stage: 'UNAWARE', to_stage: 'PROBLEM_AWARE' },
            triggered_by: 'SYSTEM',
            description: 'Stage transitioned to Problem Aware',
        },
    ];
}

export function getMockTemplates(): EmailTemplateStage[] {
    return [
        {
            stage_id: 'template_unaware',
            stage: 'UNAWARE' as EngagementStage,
            version: 1,
            status: TemplateStatus.PUBLISHED,
            subject_line: 'Streamline Your TVET Reporting',
            preview_text: 'Discover how YibaVerified simplifies compliance',
            body_html: '<p>Hello {{first_name}},</p><p>Managing TVET reporting shouldn\'t be complicated...</p>',
            cta_url: '/o/{{token}}/q/initial-interest',
            eligibility_rules: {},
            ai_instructions: {
                tone: 'professional, helpful',
                references: ['compliance challenges', 'time savings'],
                forbidden_content: ['guarantee', 'free trial'],
            },
            created_at: new Date('2024-01-15'),
            published_at: new Date('2024-01-20'),
            created_by: 'admin@yibaverified.co.za',
        },
    ];
}

export function getMockQuestionnaires(): Questionnaire[] {
    return [
        {
            questionnaire_id: 'quest_1',
            slug: 'initial-interest',
            title: 'Tell Us About Your Institution',
            description: 'Help us understand your needs',
            steps: [
                {
                    step_id: 'step_1',
                    order: 1,
                    title: 'Current Challenges',
                    copy: 'What are your biggest TVET reporting challenges?',
                    icon: '📊',
                    questions: [
                        {
                            question_id: 'q1',
                            type: QuestionType.CHECKBOX,
                            text: 'Select all that apply:',
                            options: [
                                'Time-consuming manual processes',
                                'Compliance tracking',
                                'Student record management',
                                'Reporting to QCTO',
                            ],
                            required: true,
                        },
                    ],
                },
            ],
            status: TemplateStatus.PUBLISHED,
            created_at: new Date('2024-01-10'),
            published_at: new Date('2024-01-15'),
        },
    ];
}

export function getMockResponses(questionnaireId: string): QuestionnaireResponse[] {
    return [
        {
            response_id: 'resp_1',
            questionnaire_id: questionnaireId,
            institution_id: 'inst_1',
            tracking_token: 'tok_abc123',
            answers: {
                q1: ['Time-consuming manual processes', 'Compliance tracking'],
            },
            completed: true,
            submitted_at: new Date(Date.now() - 3600000 * 24),
        },
    ];
}

export function getMockDeclines(filters?: DeclineFilters): DeclineRecord[] {
    return [
        {
            decline_id: 'decline_1',
            institution_id: 'inst_5',
            institution_name: 'Old School Training',
            reason: DeclineReason.NOT_INTERESTED,
            message: 'We are happy with our current system',
            province: 'Eastern Cape',
            stage: 'SOLUTION_AWARE' as EngagementStage,
            declined_at: new Date(Date.now() - 3600000 * 48),
        },
        {
            decline_id: 'decline_2',
            institution_id: 'inst_6',
            institution_name: 'Budget Academy',
            reason: DeclineReason.BUDGET,
            message: null,
            province: 'Gauteng',
            stage: 'PROBLEM_AWARE' as EngagementStage,
            declined_at: new Date(Date.now() - 3600000 * 120),
        },
    ];
}

export function getMockDeliverabilityMetrics(): DeliverabilityMetrics {
    return {
        bounce_rate: 4.2,
        complaint_rate: 0.1,
        unsubscribe_rate: 0.8,
        delivery_rate: 95.8,
        open_rate: 40.6,
        click_rate: 15.4,
    };
}

export function getMockBatchConfig(): BatchConfig {
    return {
        batch_size: 50,
        schedule_start_hour: 9,
        schedule_end_hour: 17,
        jitter_enabled: true,
        jitter_max_minutes: 15,
    };
}

export function getMockSuppressionList(): SuppressionEntry[] {
    return [
        {
            email: 'bounce@example.com',
            reason: 'Hard bounce',
            added_at: new Date('2024-01-20'),
            added_by: 'system',
        },
        {
            email: 'unsubscribe@test.com',
            reason: 'User unsubscribed',
            added_at: new Date('2024-01-18'),
            added_by: 'system',
        },
    ];
}

export function getMockAIDrafts(): AIDraft[] {
    return [
        {
            draft_id: 'draft_1',
            institution_id: 'inst_2',
            stage: 'TRUST_AWARE' as EngagementStage,
            subject: 'Your TVET Compliance Just Got Easier',
            body: 'Hi John, I noticed Future Leaders Institute has been exploring...',
            generated_at: new Date(Date.now() - 3600000 * 2),
            approved: null,
            approved_by: null,
            approved_at: null,
            flags: [],
        },
        {
            draft_id: 'draft_2',
            institution_id: 'inst_1',
            stage: 'PROBLEM_AWARE' as EngagementStage,
            subject: 'Cut your reporting time by 80%',
            body: 'Dear Sarah, Tech Skills Academy deserves a better way...',
            generated_at: new Date(Date.now() - 3600000 * 5),
            approved: null,
            approved_by: null,
            approved_at: null,
            flags: ['possibly-too-salesy'],
        },
    ];
}

export function getMockAIPolicy(): AIPolicy {
    return {
        allowed_phrases: [
            'streamline',
            'simplify',
            'compliance',
            'reporting',
            'TVET',
            'QCTO',
        ],
        banned_phrases: [
            'guarantee',
            'promise',
            'free',
            'limited time',
            'act now',
        ],
        tone_rules: [
            'Professional and helpful',
            'Empathetic to challenges',
            'Solution-focused',
            'Never pushy or aggressive',
        ],
        max_length: 500,
        require_approval: true,
    };
}

export function getMockAIAuditLog(limit: number): AIAuditLog[] {
    const logs: AIAuditLog[] = [];
    for (let i = 0; i < Math.min(limit, 10); i++) {
        logs.push({
            audit_id: `audit_${i + 1}`,
            institution_id: `inst_${(i % 3) + 1}`,
            prompt: `Generate trust-aware email for institution stage TRUST_AWARE...`,
            output: `Subject: Your TVET Compliance Solution\n\nDear admin...`,
            delivered: i % 2 === 0,
            delivered_at: i % 2 === 0 ? new Date(Date.now() - 3600000 * (i + 1)) : null,
            timestamp: new Date(Date.now() - 3600000 * (i + 2)),
        });
    }
    return logs;
}

export function getMockOversightMetrics(): OversightMetrics {
    return {
        total_generated_today: 45,
        success_rate: 82.5,
        intervention_rate: 17.5,
        avg_generation_time_ms: 1250,
    };
}

export function getMockGenerationLogs(): GeneratedContentLog[] {
    return [
        {
            log_id: 'log_1',
            target_institution: 'Tech Skills Academy',
            generated_at: new Date(Date.now() - 3600000 * 2),
            content_snippet: 'Subject: Your TVET Compliance...\nDear Sarah,\n\nWe noticed that...',
            prompt_template: 'initial_outreach_v1',
            sentiment_score: 0.85,
        },
        {
            log_id: 'log_2',
            target_institution: 'Future Leaders',
            generated_at: new Date(Date.now() - 3600000 * 5),
            content_snippet: 'Subject: Simplify QCTO Reporting\nHi John,\n\nAre you tired of...',
            prompt_template: 'follow_up_v2',
            sentiment_score: 0.62,
        },
    ];
}

export function getMockFlaggedContent(): FlaggedContent[] {
    return [
        {
            flag_id: 'flag_1',
            violation_type: 'Tone Policy',
            content_snippet: '...we guarantee immediate results or your money back...',
            confidence_score: 0.92,
        },
    ];
}
