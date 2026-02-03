
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { EmailType } from "@/lib/email/types";
import { getEmailService } from "@/lib/email";
import { getJobOpportunityNotificationTemplate } from "@/lib/email/templates/jobRequestTemplates";

// POST /api/public/job-request/verify
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Token required", 400);
        }

        // Find Request
        const jobRequest = await prisma.jobOpportunityRequest.findFirst({
            where: {
                verification_token: token,
                status: "PENDING_VERIFICATION",
                token_expires_at: { gt: new Date() }
            },
            include: {
                candidate: true
            }
        });

        if (!jobRequest) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "Invalid or expired verification token", 400);
        }

        // Update Status
        await prisma.jobOpportunityRequest.update({
            where: { id: jobRequest.id },
            data: {
                status: "VERIFIED_SENT",
                verified_at: new Date(),
                // Invalidate token
                // We keep the token for record or could clear it. 
                // Status change prevents reuse.
            }
        });

        // Notify Candidate
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";
        const inboxUrl = `${baseUrl}/profile/opportunities`;

        const candidateName = jobRequest.candidate.first_name;

        const emailTemplate = getJobOpportunityNotificationTemplate(
            candidateName,
            jobRequest.company_name,
            jobRequest.role_title,
            inboxUrl
        );

        const emailService = getEmailService();
        await emailService.send({
            to: jobRequest.candidate.email, // Safe to send to candidate now
            type: EmailType.JOB_OPPORTUNITY,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
            previewText: `${jobRequest.company_name} wants to hire you`,
        });

        return ok({ message: "Request verified and sent" });

    } catch (err) {
        return fail(err);
    }
}
