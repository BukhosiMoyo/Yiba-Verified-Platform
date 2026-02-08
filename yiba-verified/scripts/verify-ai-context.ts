
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "dummy-key-for-test";
import { generateEmailCopy } from "../src/lib/ai/generateEmailCopy";

// Mock global fetch to intercept OpenAI call
const originalFetch = global.fetch;
global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    if (url.toString().includes("openai")) {
        console.log("\n--- INTERCEPTED OPENAI REQUEST ---");
        if (options && options.body) {
            const body = JSON.parse(options.body as string);
            console.log("System Prompt:", body.messages[0].content);
            console.log("User Prompt:", body.messages[1].content);
        }

        return {
            ok: true,
            json: async () => ({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            subject: "Test Subject",
                            preview_text: "Test Preview",
                            body_html: "<p>Test Body</p>",
                            sentiment_analysis: "Positive"
                        })
                    }
                }]
            })
        } as Response;
    }
    return originalFetch(url, options);
};

async function testContextInjection() {
    console.log("🧪 Testing AI Context Injection...");

    const context = {
        institutionName: "Limpopo Technical College",
        recipientName: "Dr. Nkosi",
        role: "Principal",
        senderName: "Yiba Verified",
        engagementState: "UNCONTACTED",
        // Deep Context
        institutionProvince: "Limpopo",
        institutionType: "TVET College",
        strategyDirectives: "IMPORTANT: Mention the new 2026 funding deadline.",
        interactionHistory: "Previously contacted in 2024 but no response."
    };

    await generateEmailCopy(context);
    console.log("✅ Verification complete.");
}

// Simple runner
testContextInjection();
