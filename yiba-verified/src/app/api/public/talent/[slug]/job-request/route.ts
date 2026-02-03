
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { EmailType } from "@/lib/email/types";
import { getEmailService } from "@/lib/email";
import { getJobRequestVerifyTemplate } from "@/lib/email/templates/jobRequestTemplates";
import { randomBytes } from "crypto";

// POST /api/public/talent/[slug]/job-request
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();

        // Validate Public Profile
        const profile = await prisma.publicTalentProfile.findUnique({
            where: { slug, is_public: true },
            include: { user: true }
        });

        if (!profile) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "Profile not found", 404);
        }

        // Validate Body
        const {
            company_name,
            company_email,
            company_website,
            role_title,
            message,
            work_type,
            location
        } = body;

        if (!company_name || !company_email || !role_title || !message) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Missing required fields", 400);
        }

        // Rate Limit / Anti-Spam Check (Simple)
        // Check if this company email has sent a request to this candidate in last 24h
        const recentRequest = await prisma.jobOpportunityRequest.findFirst({
            where: {
                candidate_user_id: profile.user_id,
                company_email: company_email,
                created_at: {
                    gt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
                }
            }
        });

        if (recentRequest) {
            throw new AppError(ERROR_CODES.RATE_LIMIT_EXCEEDED, "You have already sent a request to this candidate recently.", 429);
        }

        // Create Verification Token
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        // Create Request (Pending)
        const jobRequest = await prisma.jobOpportunityRequest.create({
            data: {
                candidate_user_id: profile.user_id,
                candidate_profile_id: profile.id,
                company_name,
                company_email,
                company_website,
                role_title,
                message,
                work_type,
                location,
                status: "PENDING_VERIFICATION",
                verification_token: token,
                token_expires_at: expiresAt
            }
        });

        // Send Verification Email
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";
        const verifyUrl = `${baseUrl}/verify-job-request?token=${token}`;

        // Use user's name or headline for email context
        const candidateName = `${profile.user.first_name || ""} ${profile.user.last_name || ""}`.trim() || profile.headline || "Candidate";

        const emailTemplate = getJobRequestVerifyTemplate(
            company_name,
            candidateName,
            verifyUrl
        );

        const emailService = getEmailService();
        await emailService.send({
            to: company_email,
            type: EmailType.JOB_REQUEST_VERIFY,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
            previewText: "Please verify your email to send this job request",
        });

        return ok({ message: "Verification email sent" });

    } catch (err) {
        return fail(err);
    }
}
