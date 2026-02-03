
import { getEmailService } from "../src/lib/email";
import { EmailType } from "../src/lib/email/types";
import dotenv from "dotenv";

dotenv.config();

async function testEmail() {
    const emailService = getEmailService();

    if (!process.env.RESEND_API_KEY && process.env.EMAIL_PROVIDER !== "console") {
        console.error("❌ RESEND_API_KEY is missing in .env");
        console.log("Please add RESEND_API_KEY=re_... to your .env file");
        process.exit(1);
    }

    console.log("📧 Testing Email Service...");
    console.log("Provider:", process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? "resend" : "console"));

    const targetEmail = process.env.TEST_EMAIL || "delivered@resend.dev";
    // delivered@resend.dev always returns success in Resend test mode

    console.log(`Sending test email to: ${targetEmail}`);

    const typesToTest = [
        EmailType.INVITE,
        EmailType.PASSWORD_RESET,
        EmailType.VERIFICATION,
        EmailType.WELCOME,
        EmailType.NOTIFICATION,
        EmailType.INACTIVITY,
        EmailType.SYSTEM_ALERT
    ];

    console.log(`\n🧪 Testing ${typesToTest.length} email types...`);

    for (const type of typesToTest) {
        console.log(`\n➡️  Sending ${type}...`);
        const result = await emailService.send({
            to: targetEmail,
            type: type,
            subject: `[TEST] ${type} - Yiba Verified`,
            html: `<p>Test execution for type: <strong>${type}</strong></p>`,
        });

        if (result.success) {
            console.log(`✅ ${type} Sent OK`);
        } else {
            console.error(`❌ ${type} Failed:`, result.error);
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
    }
}

testEmail();
