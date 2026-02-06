import { AI_POLICY } from "./policy";
import { InstitutionAdminInviteSchema, InstitutionAdminInvite } from "./schemas/institutionAdminInvite";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generates personalized email copy for an Institution Admin invite.
 * Uses OpenAI to strictly adhere to the AI Policy and Strategy.
 * 
 * @param context Key details about the institution/recipient to personalize the email.
 * @returns Key email fields (subject, body_html, preview_text)
 */
export async function generateEmailCopy(context: {
    institutionName: string;
    recipientName: string;
    role: string;
    senderName: string; // usually "Yiba Verified Platform"
    engagementState: string; // e.g. "UNCONTACTED"
    specialContext?: string; // e.g. "They operate in Limpopo"
}): Promise<InstitutionAdminInvite | null> {
    if (!OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set. Skipping AI generation.");
        return null;
    }

    const systemPrompt = `
${AI_POLICY.CORE_DIRECTIVES.join("\n")}

You are generating an invitation email for an Institution Admin to join Yiba Verified.
Current Engagement State: ${context.engagementState}
Tone Guideline: ${AI_POLICY.TONE_GUIDELINES[context.engagementState as keyof typeof AI_POLICY.TONE_GUIDELINES] || "Professional and helpful."}

Constraints:
- Max Tokens: ${AI_POLICY.SAFETY_BOUNDARIES.MAX_TOKENS}
- Prohibited Phrases: ${AI_POLICY.SAFETY_BOUNDARIES.PROHIBITED_PHRASES.join(", ")}
- Output MUST be valid JSON matching the schema: { subject, preview_text, body_html, sentiment_analysis }
`;

    const userPrompt = `
Recipient: ${context.recipientName}
Institution: ${context.institutionName}
Role: ${context.role}
Sender: ${context.senderName}
Special Context: ${context.specialContext || "None"}

Write a short, trust-building email inviting them to claim their institution's profile.
Focus on the benefits of verification and student trust.
Do not sell. Just invite.
`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o", // Use a capable model for structured JSON
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            console.error(`OpenAI API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            console.error("OpenAI returned empty content.");
            return null;
        }

        // Parse and Validate w/ Zod
        const result = InstitutionAdminInviteSchema.safeParse(JSON.parse(content));

        if (!result.success) {
            console.error("AI Output Validation Failed:", result.error);
            return null;
        }

        return result.data;

    } catch (error) {
        console.error("Error generating AI email copy:", error);
        return null;
    }
}
