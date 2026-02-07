import { EngagementState } from "@prisma/client";

/**
 * Re-export EngagementState for convenience to avoid importing from @prisma/client everywhere.
 * Or we can just use the Prisma one directly.
 */
export { EngagementState };
export { EngagementState as EngagementStage };

/**
 * Events that influence the engagement score.
 * Each event type has a specific point value.
 */
export enum EngagementEventType {
    EMAIL_OPENED = "EMAIL_OPENED",
    LINK_CLICKED = "LINK_CLICKED",
    LANDING_PAGE_VIEWED = "LANDING_PAGE_VIEWED",
    INVITE_ACCEPTED = "INVITE_ACCEPTED",
    INVITE_DECLINED = "INVITE_DECLINED",
    MANUAL_INTERVENTION = "MANUAL_INTERVENTION",
}

/**
 * Structure of a single entry in the engagement history log.
 */
export interface EngagementHistoryEntry {
    timestamp: string; // ISO string
    event: EngagementEventType | string; // Allow string for custom events
    scoreDelta: number;
    newState?: EngagementState;
    metadata?: Record<string, any>;
}

/**
 * Constants for scoring logic.
 * These should match the Strategy Document.
 */
export const SCORING_POINTS: Record<EngagementEventType, number> = {
    [EngagementEventType.EMAIL_OPENED]: 5,
    [EngagementEventType.LINK_CLICKED]: 10,
    [EngagementEventType.LANDING_PAGE_VIEWED]: 15,
    [EngagementEventType.INVITE_ACCEPTED]: 50, // Should probably transition state immediately
    [EngagementEventType.INVITE_DECLINED]: -50, // Should transition to DECLINED
    [EngagementEventType.MANUAL_INTERVENTION]: 0,
};

export const MAX_SCORE = 100;
export const DECAY_RATE_PER_DAY = 1; // Points lost per day of inactivity
export const ENGAGEMENT_THRESHOLD = 30; // Score required to be considered "ENGAGED"

// ==========================================
// AWARENESS ENGINE TYPES (Multi-stage system)
// ==========================================

export enum DeclineReason {
    NOT_INTERESTED = 'NOT_INTERESTED',
    BUDGET = 'BUDGET',
    TIMING = 'TIMING',
    ALREADY_USING = 'ALREADY_USING',
    OTHER = 'OTHER',
}

export enum OutreachEventType {
    EMAIL_SENT = 'EMAIL_SENT',
    EMAIL_OPENED = 'EMAIL_OPENED',
    LINK_CLICKED = 'LINK_CLICKED',
    FORM_SUBMITTED = 'FORM_SUBMITTED',
    AI_EMAIL_GENERATED = 'AI_EMAIL_GENERATED',
    STAGE_CHANGED = 'STAGE_CHANGED',
    DECLINED = 'DECLINED',
    CONVERTED = 'CONVERTED',
    BOUNCED = 'BOUNCED',
    UNSUBSCRIBED = 'UNSUBSCRIBED',
}

export enum TemplateStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
}

export enum QuestionType {
    RADIO = 'RADIO',
    CHECKBOX = 'CHECKBOX',
    TEXT = 'TEXT',
    OTHER_REVEAL = 'OTHER_REVEAL',
}

export interface Contact {
    contact_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    primary: boolean;
}

export interface StatusFlags {
    bounced: boolean;
    opt_out: boolean;
    declined: boolean;
    ai_suppressed: boolean;
}

export interface InstitutionOutreachProfile {
    institution_id: string;
    institution_name: string;
    domain: string;
    province: string;
    engagement_stage: EngagementState;
    engagement_score: number;
    last_activity: Date;
    next_scheduled_step: Date | null;
    status_flags: StatusFlags;
    contacts: Contact[];
}

export interface OutreachEvent {
    event_id: string;
    institution_id: string;
    event_type: OutreachEventType;
    timestamp: Date;
    metadata: Record<string, any>;
    triggered_by: 'SYSTEM' | 'AI' | 'HUMAN';
    description?: string;
}

export interface AIInstructions {
    tone: string;
    references: string[];
    forbidden_content: string[];
}

export interface EmailTemplateStage {
    stage_id: string;
    stage: EngagementState;
    version: number;
    status: TemplateStatus;
    subject_line: string;
    preview_text: string;
    body_html: string;
    cta_url: string;
    eligibility_rules: Record<string, any>;
    ai_instructions: AIInstructions;
    created_at: Date;
    published_at: Date | null;
    created_by: string;
}

export interface Question {
    question_id: string;
    type: QuestionType;
    text: string;
    options: string[] | null;
    required: boolean;
}

export interface QuestionnaireStep {
    step_id: string;
    order: number;
    title: string;
    copy: string;
    icon: string;
    questions: Question[];
}

export interface Questionnaire {
    questionnaire_id: string;
    slug: string;
    title: string;
    description: string;
    steps: QuestionnaireStep[];
    status: TemplateStatus;
    created_at: Date;
    published_at: Date | null;
}

export interface QuestionnaireResponse {
    response_id: string;
    questionnaire_id: string;
    institution_id: string;
    tracking_token: string;
    answers: Record<string, any>;
    completed: boolean;
    submitted_at: Date | null;
}

export interface OutreachMetrics {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    responses: number;
    signups: number;
    declines: number;
    conversion_rate: number;
    avg_time_to_signup_hours: number;
}

export interface TrendDataPoint {
    date: string;
    opens: number;
    clicks: number;
    signups: number;
}

export interface Alert {
    alert_id: string;
    type: 'DELIVERABILITY_DIP' | 'HIGH_DECLINES' | 'QUEUE_ISSUE' | 'BOUNCE_RATE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
}

export interface DeclineRecord {
    decline_id: string;
    institution_id: string;
    institution_name: string;
    reason: DeclineReason;
    message: string | null;
    province: string;
    stage: EngagementState;
    declined_at: Date;
}

export interface DeliverabilityMetrics {
    bounce_rate: number;
    complaint_rate: number;
    unsubscribe_rate: number;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
}

export interface BatchConfig {
    batch_size: number;
    schedule_start_hour: number;
    schedule_end_hour: number;
    jitter_enabled: boolean;
    jitter_max_minutes: number;
}

export interface SuppressionEntry {
    email: string;
    reason: string;
    added_at: Date;
    added_by: string;
}

export interface AIDraft {
    draft_id: string;
    institution_id: string;
    stage: EngagementState;
    subject: string;
    body: string;
    generated_at: Date;
    approved: boolean | null;
    approved_by: string | null;
    approved_at: Date | null;
    flags: string[];
}

export interface AIPolicy {
    allowed_phrases: string[];
    banned_phrases: string[];
    tone_rules: string[];
    max_length: number;
    require_approval: boolean;
}

export interface AIAuditLog {
    audit_id: string;
    institution_id: string;
    prompt: string;
    output: string;
    delivered: boolean;
    delivered_at: Date | null;
    timestamp: Date;
}

export interface InstitutionFilters {
    stage?: EngagementState;
    province?: string;
    score_min?: number;
    score_max?: number;
    last_activity_days?: number;
    hot_leads?: boolean;
    stuck_leads?: boolean;
    search?: string;
}

export interface DeclineFilters {
    province?: string;
    stage?: EngagementState;
    reason?: DeclineReason;
    date_from?: Date;
    date_to?: Date;
}

export interface FlaggedContent {
    flag_id: string;
    violation_type: string;
    content_snippet: string;
    confidence_score: number;
}
