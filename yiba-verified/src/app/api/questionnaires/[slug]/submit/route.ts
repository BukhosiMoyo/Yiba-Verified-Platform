import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateResponse, ResponseContext } from "@/lib/ai/responseEngine";
import { AIResponseTrigger, EngagementState } from "@/lib/outreach/types";

const prisma = new PrismaClient();

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const body = await req.json();
    const { answers, token } = body;

    try {
        const questionnaire = await prisma.questionnaire.findUnique({
            where: { slug }
        });

        if (!questionnaire) {
            return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 });
        }

        let institutionId = null;
        let institutionName = "Unknown Institution";
        let invite = null;

        // 1. Resolve Institution via Token
        if (token) {
            invite = await prisma.invite.findUnique({
                where: { engagement_token: token }
            });
            if (invite) {
                institutionId = invite.institution_id;
                // Fetch institution details for AI context
                // In a real app we would join above, but let's be safe
                // We actually store minimal info on Invite, need to fetch Institution profile?
                // The Invite has 'institution_id', let's fetch the Institution Outreach Profile (mocked or real)
                // Use a helper or just query raw
            }
        }

        // If no token, check for Sandbox/Dev fallback
        if (!institutionId && process.env.NODE_ENV === 'development') {
            // For sandbox verification, let's use a dummy ID if allowed
            // But we want to test AI, so we need context.
            // We'll proceed with "Unknown" context if necessary, or just skip AI.
        }

        // 2. Save Response (Mock Logic or Create Record)
        // We really should create a QuestionnaireResponse here.
        if (institutionId) {
            await prisma.questionnaireResponse.create({
                data: {
                    questionnaire_id: questionnaire.questionnaire_id,
                    institution_id: institutionId,
                    tracking_token: token || `anon-${Date.now()}`,
                    answers: answers,
                    completed: true,
                    submitted_at: new Date()
                }
            });
        }

        // 3. Trigger AI Response
        let aiResponse = null;
        if (invite && institutionId) {
            // Need to fetch full institution profile for context
            // Or just use what we have on Invite? Invite has distinct fields?
            // Invite model has: engagement_state, engagement_history
            // Institution model has: name, province?

            // Let's assume we can fetch basic details.
            // Since I can't easily see Institution table structure fully (it's huge),
            // I'll assume it has `name` which is standard.

            // Fetch Institution
            const institution = await prisma.institution.findUnique({
                where: { institution_id: institutionId }
            });

            if (institution) {
                const context: ResponseContext = {
                    institutionName: institution.trading_name || institution.legal_name || "Valued Institution",
                    recipientName: "Colleague", // Default if not known
                    role: "Administrator",
                    currentStage: invite.engagement_state, // Use Invite state as truth for Outreach
                    trigger: AIResponseTrigger.QUESTIONNAIRE_SUBMIT,
                    payload: answers,
                    interactionHistory: JSON.stringify(invite.engagement_history || []) // Simplify history
                };

                aiResponse = await generateResponse(context);

                if (aiResponse) {
                    // 4. Log AI Response to Interaction History
                    const historyEntry = {
                        timestamp: new Date().toISOString(),
                        event: "AI_RESPONSE_GENERATED",
                        scoreDelta: 0,
                        metadata: {
                            trigger_type: AIResponseTrigger.QUESTIONNAIRE_SUBMIT,
                            stage_at_time: invite.engagement_state,
                            strategy_used: aiResponse.strategy_used,
                            generated_content: {
                                subject: aiResponse.subject,
                                preview: aiResponse.preview_text
                            }
                        }
                    };

                    // Update Invite History
                    const currentHistory = (invite.engagement_history as any[]) || [];
                    await prisma.invite.update({
                        where: { invite_id: invite.invite_id },
                        data: {
                            engagement_history: [...currentHistory, historyEntry]
                        }
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            ai_generated: !!aiResponse
        });

    } catch (error) {
        console.error("Error submitting questionnaire:", error);
        return NextResponse.json({ error: "Submission failed" }, { status: 500 });
    }
}
