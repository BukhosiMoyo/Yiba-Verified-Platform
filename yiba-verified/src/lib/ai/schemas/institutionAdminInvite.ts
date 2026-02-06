import { z } from "zod";

/**
 * Zod schema for the structured output expected from the AI email generator.
 * This ensures the AI always returns a usable JSON object with subject, body, and preview.
 */
export const InstitutionAdminInviteSchema = z.object({
    subject: z.string().describe("The email subject line. Must be clear, short, and benefit-focused."),
    preview_text: z.string().describe("The preview text shown in the inbox. Must complement the subject."),
    body_html: z.string().describe("The body content in HTML format. Keep paragraphs short. Use simple formatting."),
    sentiment_analysis: z.string().optional().describe("A brief explanation of why this tone was chosen."),
});

export type InstitutionAdminInvite = z.infer<typeof InstitutionAdminInviteSchema>;
