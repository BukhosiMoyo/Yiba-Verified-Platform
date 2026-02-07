import { OutreachEventType, EngagementState } from "../types";

export interface SandboxSession {
    session_id: string;
    name: string;
    institution_name: string;
    current_stage: string; // Mapped to EngagementState
    engagement_score: number;
    created_at: Date;
    ai_enabled: boolean;
}

export interface SandboxEvent {
    event_id: string;
    session_id: string;
    event_type: string;
    timestamp: Date;
    metadata: any;
    description?: string;
}

export interface SandboxMessage {
    message_id: string;
    session_id: string;
    subject: string;
    preview_text?: string;
    body_html: string;
    from_name?: string;
    status: 'DRAFT' | 'SENT' | 'OPENED' | 'CLICKED';
    sent_at?: Date;
    opened_at?: Date;
    template_id?: string;
    ai_draft_id?: string;
}
