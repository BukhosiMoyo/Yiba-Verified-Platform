import { prisma } from "@/lib/prisma";
import { TemplateStatus, EmailTemplateStage, EngagementState } from "../types";

/**
 * Manages email template versions.
 */
export async function publishTemplateVersion(
    stageId: string, // actually we usually look up by composite key (Stage + Type) or just ID
    content: { subject: string; body: string },
    editorId: string
): Promise<EmailTemplateStage> {

    // 1. Get current active version to increment number
    // const current = await prisma.emailTemplate.findFirst({ ... });
    const nextVersion = 1; // mock

    // 2. Create new immutable record
    /*
    const template = await prisma.emailTemplate.create({
        data: {
            stage: 'UNCONTACTED', // mocked
            version: nextVersion,
            status: TemplateStatus.PUBLISHED,
            subject_line: content.subject,
            body_html: content.body,
            created_by: editorId,
            published_at: new Date()
        }
    });
    */

    // Return mock
    return {
        stage_id: "mock_id",
        stage: EngagementState.UNCONTACTED,
        version: nextVersion,
        status: TemplateStatus.PUBLISHED,
        subject_line: content.subject,
        preview_text: "",
        body_html: content.body,
        cta_url: "",
        eligibility_rules: {},
        ai_instructions: { tone: "Professional", references: [], forbidden_content: [] },
        created_at: new Date(),
        published_at: new Date(),
        created_by: editorId
    };
}

export async function getActiveTemplate(stage: EngagementState): Promise<EmailTemplateStage | null> {
    // return prisma.emailTemplate.findFirst({ where: { stage, status: 'PUBLISHED' }, orderBy: { version: 'desc' } });
    return null;
}
