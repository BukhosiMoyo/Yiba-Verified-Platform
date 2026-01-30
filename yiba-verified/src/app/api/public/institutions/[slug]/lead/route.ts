/**
 * POST /api/public/institutions/[slug]/lead
 * Submit a lead/enquiry (no auth). Creates InstitutionLead with source PUBLIC.
 * Notifies institution staff (in-app + email) via Notifications.newLead.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { Notifications } from "@/lib/notifications";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rateLimit";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.STRICT);
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { "Retry-After": String(retryAfter), "Content-Type": "application/json" } }
      );
    }

    const { slug } = await params;
    if (!slug?.trim()) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Slug is required", 400));
    }

    const profile = await prisma.institutionPublicProfile.findFirst({
      where: { slug: slug.trim(), is_public: true },
      select: { institution_id: true },
    });

    if (!profile) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Institution profile not found or not public", 404));
    }

    const body = await request.json();
    const full_name = typeof body?.full_name === "string" ? body.full_name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
    const location = typeof body?.location === "string" ? body.location.trim() : null;
    const highest_education_level = typeof body?.highest_education_level === "string" ? body.highest_education_level.trim() : null;
    const qualification_interest = typeof body?.qualification_interest === "string" ? body.qualification_interest.trim() : null;
    const message = typeof body?.message === "string" ? body.message.trim() : null;

    if (!full_name || full_name.length < 2) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Full name is required (min 2 characters)", 400));
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Valid email is required", 400));
    }

    const lead = await prisma.institutionLead.create({
      data: {
        institution_id: profile.institution_id,
        source: "PUBLIC",
        full_name,
        email,
        phone: phone || null,
        location: location || null,
        highest_education_level: highest_education_level || null,
        qualification_interest: qualification_interest || null,
        message: message || null,
        status: "NEW",
      },
    });

    Notifications.newLead(lead.id, profile.institution_id, { full_name, email, message }).catch((err) => {
      console.error("Lead notification failed (non-blocking):", err);
    });

    return Response.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/public/institutions/[slug]/lead error:", error);
    return fail(error instanceof AppError ? error : new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to submit enquiry", 500));
  }
}
