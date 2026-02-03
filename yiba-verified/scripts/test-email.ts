
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

    const result = await emailService.send({
        to: targetEmail,
        type: EmailType.SYSTEM_ALERT,
        subject: "Yiba Verified - Test Email",
        html: `
      <h1>It Works!</h1>
      <p>This is a test email from Yiba Verified email infrastructure.</p>
      <p>Time: ${new Date().toISOString()}</p>
    `,
        text: "It Works! This is a test email from Yiba Verified email infrastructure.",
    });

    if (result.success) {
        console.log("✅ Email sent successfully!");
    } else {
        console.error("❌ Failed to send email:", result.error);
    }
}

testEmail();
