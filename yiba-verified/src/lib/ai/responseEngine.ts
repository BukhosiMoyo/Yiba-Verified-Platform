
import { AI_POLICY, STAGE_INSTRUCTIONS } from "./policy";
import { AIResponseTrigger, AIResponseStrategy, EngagementState, InstitutionOutreachProfile } from "../outreach/types";
import { InstitutionAdminInviteSchema } from "./schemas/institutionAdminInvite";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface ResponseContext {
    institutionName: string;
    recipientName: string;
    role: string;
    currentStage: EngagementState;
    trigger: AIResponseTrigger;
    payload?: any; // e.g. Questionnaire Answers, Decline Reason
    interactionHistory?: string;
}

export async function generateResponse(context: ResponseContext) {
    if (!OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set. Skipping AI generation.");
        return null;
    }

    // 1. Determine Strategy
    const strategy = determineStrategy(context.trigger, context.currentStage);

    // 2. Construct Prompts
    const systemPrompt = constructSystemPrompt(strategy);
    const userPrompt = constructUserPrompt(context, strategy);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
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

        if (!content) return null;

        // reuse schema or a new one? reuse invite schema for now as it has subject/body
        const result = InstitutionAdminInviteSchema.safeParse(JSON.parse(content));

        if (!result.success) {
            console.error("AI Output Validation Failed:", result.error);
            return null;
        }

        return {
            ...result.data,
            strategy_used: strategy.goal,
            trigger: context.trigger
        };

    } catch (error) {
        console.error("Error generating AI response:", error);
        return null;
    }
}

function determineStrategy(trigger: AIResponseTrigger, stage: EngagementState): AIResponseStrategy {
    const strategy: AIResponseStrategy = {
        trigger,
        stage,
        goal: "Respond helpfully",
        rules: [],
        allowed_ctas: []
    };

    // Trigger Mapping
    switch (trigger) {
        case AIResponseTrigger.QUESTIONNAIRE_SUBMIT:
            // Map Stage to Strategy
            // We use the STAGE_INSTRUCTIONS from policy.ts
            // But strict EngagementState doesn't map 1:1 to "UNAWARE/PROBLEM_AWARE" easily without a helper.
            // Let's assume the calling code provides the correct semantic stage or we map it.
            // For now, use stage directly if it matches keys, or fallback.
            const stageKey = mapEngagementStateToInstructionKey(stage);
            const instructions = STAGE_INSTRUCTIONS[stageKey] || STAGE_INSTRUCTIONS["UNAWARE"]; // Default

            strategy.goal = instructions.goal;
            strategy.rules = instructions.must.concat(instructions.avoid.map(r => `AVOID: ${r}`));
            break;

        case AIResponseTrigger.DECLINE_WITH_REASON:
            strategy.goal = "Respect decision and leave door open";
            strategy.rules = [AI_POLICY.DECLINE_RULES.WITH_REASON];
            break;

        case AIResponseTrigger.DECLINE_NO_REASON:
            strategy.goal = "Respect decision";
            strategy.rules = ["Be brief", "No counter-arguments"];
            break;

        case AIResponseTrigger.LINK_CLICK:
            strategy.goal = "Nudge gently if no action taken";
            strategy.rules = ["Do not acknowledge the click explicitly (creepy)", "Just offer help"];
            break;
    }

    return strategy;
}


function constructSystemPrompt(strategy: AIResponseStrategy): string {
    return `
${AI_POLICY.CORE_DIRECTIVES.join("\n")}

GLOBAL TONE:
${JSON.stringify(AI_POLICY.TONE_GUIDELINES, null, 2)}

SAFETY:
Max Words: ${AI_POLICY.SAFETY_BOUNDARIES.MAX_TOKENS} (approx words)
Prohibited: ${AI_POLICY.SAFETY_BOUNDARIES.PROHIBITED_PHRASES.join(", ")}

CURRENT STRATEGY:
Goal: ${strategy.goal}
Rules:
${strategy.rules.map(r => `- ${r}`).join("\n")}

Output must be JSON: { subject, preview_text, body_html, sentiment_analysis }
`;
}

function constructUserPrompt(context: ResponseContext, strategy: AIResponseStrategy): string {
    let contextStr = `
Recipient: ${context.recipientName}
Role: ${context.role}
Institution: ${context.institutionName}
Current Stage: ${context.currentStage}
Trigger: ${context.trigger}
`;

    if (context.payload) {
        contextStr += `\nLatest Interaction Payload: ${JSON.stringify(context.payload)}`;
    }

    if (context.interactionHistory) {
        contextStr += `\nHistory: ${context.interactionHistory}`;
    }

    return `
${contextStr}

Write a response email following the strategy goal: "${strategy.goal}".
`;
}

function mapEngagementStateToInstructionKey(stage: EngagementState): string {
    // Mapping from Prisma Enum to Policy Keys
    switch (stage) {
        case EngagementState.UNCONTACTED: return "UNAWARE"; // or initial
        case EngagementState.CONTACTED: return "PROBLEM_AWARE";
        case EngagementState.ENGAGED: return "SOLUTION_AWARE";
        case EngagementState.READY: return "TRUST_AWARE"; // Onboarding
        case EngagementState.ACTIVE: return "ACTION_READY";
        default: return "UNAWARE";
    }
}
