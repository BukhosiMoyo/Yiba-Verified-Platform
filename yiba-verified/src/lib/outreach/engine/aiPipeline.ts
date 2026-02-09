import { AIDraft, AIInstructions, OutreachEventType } from "../types";
import { logOutreachEvent } from "./eventStore";

/**
 * Builds the prompt for the AI based on context and policy.
 */
export function buildAiPrompt(
    institutionName: string,
    context: Record<string, any>,
    instructions: AIInstructions
): string {
    return `
    Draft an outreach email for ${institutionName}.
    Tone: ${instructions.tone}
    Context: ${JSON.stringify(context)}
    Do NOT use: ${instructions.forbidden_content.join(", ")}
    `;
}

/**
 * Generates a draft using the AI service (mocked).
 */
export async function generateDraft(
    institutionId: string,
    prompt: string,
    systemPrompt: string
): Promise<AIDraft> {

    // Call LLM here
    // Call LLM here
    // Simple heuristic mock for now to respond to prompt content
    const isMock = true;
    let mockOutput = "";

    if (isMock) {
        const subjectMatch = prompt.match(/Questionnaire \((.*?)\)/);
        const questionnaireTitle = subjectMatch ? subjectMatch[1] : "Verification Process";

        mockOutput = `Subject: Action Required: ${questionnaireTitle} - Yiba Verified

Body: <p>Dear Partner,</p>

<p>We hope this email finds you well.</p>

<p>As part of your accreditation journey with Yiba Verified, we require some additional information to proceed to the next stage.</p>

<p><strong>Please complete the attached questionnaire: ${questionnaireTitle}</strong></p>

<p>This will help us understand your specific needs and compliance status.</p>

<p><br/></p>
<p>Best regards,</p>
<p>The Yiba Team</p>`;
    } else {
        mockOutput = "Subject: Hello\n\nBody: This is a draft.";
    }

    // Log the generation attempt
    await logOutreachEvent(
        institutionId,
        OutreachEventType.AI_EMAIL_GENERATED,
        'AI',
        { prompt_snippet: prompt.substring(0, 50) }
    );

    const subject = mockOutput.match(/Subject: (.*)/)?.[1] || "Update from Yiba";
    const body = mockOutput.split("Body: ")[1] || mockOutput;

    return {
        draft_id: "draft_" + Date.now(),
        institution_id: institutionId,
        stage: "UNCONTACTED" as any,
        subject: subject,
        body: body,
        generated_at: new Date(),
        approved: null,
        approved_by: null,
        approved_at: null,
        flags: []
    };
}
