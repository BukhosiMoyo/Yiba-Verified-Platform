import { PrismaClient } from "@prisma/client";

export async function seedEmailTemplates(prisma: PrismaClient) {
    console.log("Seeding email templates...");

    const TEMPLATES_TO_SEED = [
        {
            type: "INSTITUTION_ADMIN_INVITE",
            name: "Institution Admin Invite",
            subject: "You're invited to manage {{institution_name}} on Yiba Verified",
            body_sections: [
                { type: "paragraph", content: "Hi {{recipient_name}}," },
                { type: "paragraph", content: "{{inviter_name}} has invited you to manage {{institution_name}} on Yiba Verified — the QCTO-recognised platform for qualification verification and accreditation." },
                { type: "paragraph", content: "We've introduced a new way to review your invitation details before accepting." },
                { type: "paragraph", content: "Click the button below to review your role and capabilities. This link expires in 7 days." },
            ],
            cta_text: "Accept Invitation",
            footer_html: "If you didn't expect this invitation, you can safely ignore this email. Questions? Contact support@yibaverified.co.za",
        },
        {
            type: "INSTITUTION_STAFF_INVITE",
            name: "Institution Staff Invite",
            subject: "You're invited to join {{institution_name}} on Yiba Verified",
            body_sections: [
                { type: "paragraph", content: "Hi {{recipient_name}}," },
                { type: "paragraph", content: "{{inviter_name}} has invited you to join {{institution_name}} on Yiba Verified as a staff member." },
                { type: "paragraph", content: "You'll be able to assist with managing learners, uploading documents, and tracking submissions." },
                { type: "paragraph", content: "Click below to review your invitation and set up your account." },
            ],
            cta_text: "Review invitation",
            footer_html: "If you didn't expect this invitation, you can safely ignore this email. Questions? Contact support@yibaverified.co.za",
        },
        {
            type: "STUDENT_INVITE",
            name: "Student Invite",
            subject: "Invitation to join {{institution_name}} on Yiba Verified",
            body_sections: [
                { type: "paragraph", content: "Hi {{recipient_name}}," },
                { type: "paragraph", content: "{{institution_name}} has invited you to access your learner profile and digital records on Yiba Verified." },
                { type: "paragraph", content: "This is your secure portal for tracking your qualifications and achievements." },
                { type: "paragraph", content: "Please accept this invitation to create your account." },
            ],
            cta_text: "Accept Invitation",
            footer_html: "If you didn't expect this invitation, you can safely ignore this email. Questions? Contact support@yibaverified.co.za",
        },
        {
            type: "QCTO_INVITE",
            name: "QCTO User Invite",
            subject: "Invitation to Yiba Verified (QCTO Team)",
            body_sections: [
                { type: "paragraph", content: "Hi {{recipient_name}}," },
                { type: "paragraph", content: "You have been invited to join the Yiba Verified platform as a QCTO user." },
                { type: "paragraph", content: "Role: {{role}}" },
                { type: "paragraph", content: "Please click below to set up your secure access." },
            ],
            cta_text: "Setup Account",
            footer_html: "If you didn't expect this invitation, you can safely ignore this email. Questions? Contact support@yibaverified.co.za",
        },
        {
            type: "PLATFORM_ADMIN_INVITE",
            name: "Platform Admin Invite",
            subject: "Admin Access Invitation: Yiba Verified",
            body_sections: [
                { type: "paragraph", content: "Hi {{recipient_name}}," },
                { type: "paragraph", content: "You have been granted Platform Administrator access to Yiba Verified." },
                { type: "paragraph", content: "Please use the link below to configure your credentials." },
            ],
            cta_text: "Access Dashboard",
            footer_html: "This is a privileged access invitation. Do not forward.",
        },
        {
            type: "SYSTEM_NOTIFICATION",
            name: "System Notification",
            subject: "{{title}}",
            body_sections: [
                { type: "paragraph", content: "Hi {{recipient_name}}," },
                { type: "paragraph", content: "{{message}}" },
                { type: "paragraph", content: "View the full details in your dashboard." },
            ],
            cta_text: "View Dashboard",
            footer_html: "You received this notification because of your account settings. Contact support if this is an error.",
        },
        {
            type: "AUTH_PASSWORD_RESET",
            name: "Password Reset",
            subject: "Reset your Yiba Verified password",
            body_sections: [
                { type: "paragraph", content: "Hi {{recipient_name}}," },
                { type: "paragraph", content: "We received a request to reset the password for your Yiba Verified account." },
                { type: "paragraph", content: "If you made this request, click the button below to choose a new password. This link expires in 1 hour." },
            ],
            cta_text: "Reset Password",
            footer_html: "If you didn't request a password reset, you can safely ignore this email. Your account is secure.",
        },
        {
            type: "AUTH_EMAIL_VERIFY",
            name: "Email Verification",
            subject: "Verify your email address for Yiba Verified",
            body_sections: [
                { type: "paragraph", content: "Hi {{recipient_name}}," },
                { type: "paragraph", content: "Thanks for signing up for Yiba Verified." },
                { type: "paragraph", content: "Please verify your email address to complete your registration and secure your account." },
            ],
            cta_text: "Verify Email",
            footer_html: "If you didn't create an account, please ignore this email.",
        },
    ];

    let count = 0;
    try {
        for (const t of TEMPLATES_TO_SEED) {
            await prisma.emailTemplate.upsert({
                where: { type: t.type as any },
                create: {
                    type: t.type as any,
                    name: t.name,
                    subject: t.subject,
                    header_html: null,
                    body_sections: t.body_sections as any,
                    cta_text: t.cta_text,
                    footer_html: t.footer_html,
                    is_active: true,
                },
                update: {
                    name: t.name,
                    subject: t.subject,
                    body_sections: t.body_sections as any,
                    cta_text: t.cta_text,
                    footer_html: t.footer_html,
                },
            });
            count++;
        }
        console.log(`✅ Seeded/Updated ${count} email templates.`);
    } catch (err) {
        console.warn("⚠️ Email template seed skipped:", (err as Error).message);
    }
}
