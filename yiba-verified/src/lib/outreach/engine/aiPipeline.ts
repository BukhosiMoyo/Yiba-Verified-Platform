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
    const mockOutput = "Subject: Hello\n\nBody: This is a draft.";

    // Log the generation attempt
    await logOutreachEvent(
        institutionId,
        OutreachEventType.AI_EMAIL_GENERATED,
        'AI',
        { prompt_snippet: prompt.substring(0, 50) }
    );

    return {
        draft_id: "draft_" + Date.now(),
        institution_id: institutionId,
        stage: "UNCONTACTED" as any,
        subject: "Hello",
        body: "This is a draft",
        generated_at: new Date(),
        approved: null,
        approved_by: null,
        approved_at: null,
        flags: []
    };
}
