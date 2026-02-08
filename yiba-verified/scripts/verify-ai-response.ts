
import { generateResponse, ResponseContext } from "../src/lib/ai/responseEngine";
import { AIResponseTrigger, EngagementState } from "../src/lib/outreach/types";

// Mock global fetch to intercept OpenAI call
const originalFetch = global.fetch;
global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    if (url.toString().includes("openai")) {
        console.log("\n--- INTERCEPTED OPENAI REQUEST ---");
        if (options && options.body) {
            const body = JSON.parse(options.body as string);
            console.log("System Prompt:\n", body.messages[0].content);
            console.log("User Prompt:\n", body.messages[1].content);
        }

        return {
            ok: true,
            json: async () => ({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            subject: "AI Generated Subject",
                            preview_text: "AI Preview",
                            body_html: "<p>AI Body</p>",
                            sentiment_analysis: "Neutral"
                        })
                    }
                }]
            })
        } as Response;
    }
    return originalFetch(url, options);
};

process.env.OPENAI_API_KEY = "test-key";

async function verifyAIResponses() {
    console.log("🧪 Testing AI Response Engine...");

    // Test 1: Questionnaire Submit (Unaware -> Problem Aware)
    console.log("\n\nTEST 1: Questionnaire Submit (Stage: UNCONTACTED/UNAWARE)");
    await generateResponse({
        institutionName: "KZN Academy",
        recipientName: "Mr. Smith",
        role: "Rector",
        currentStage: EngagementState.UNCONTACTED,
        trigger: AIResponseTrigger.QUESTIONNAIRE_SUBMIT,
        payload: { q1: "Using Spreadsheets", q2: "Risk is high" }
    });

    // Test 2: Decline with Reason
    console.log("\n\nTEST 2: Decline (Reason: ALREADY_USING)");
    await generateResponse({
        institutionName: "Cape College",
        recipientName: "Ms. Jones",
        role: "Admin",
        currentStage: EngagementState.CONTACTED,
        trigger: AIResponseTrigger.DECLINE_WITH_REASON,
        payload: { reason: "already_using_other_platform" }
    });

    // Test 3: Link Click (Nudge)
    console.log("\n\nTEST 3: Link Click (Nudge)");
    await generateResponse({
        institutionName: "Joburg School",
        recipientName: "Dr. Dave",
        role: "Principal",
        currentStage: EngagementState.ENGAGED,
        trigger: AIResponseTrigger.LINK_CLICK
    });
}

verifyAIResponses();
