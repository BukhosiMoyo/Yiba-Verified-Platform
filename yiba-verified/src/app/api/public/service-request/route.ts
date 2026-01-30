/**
 * POST /api/public/service-request
 * Submit a platform-level service request (no auth). Creates ServiceRequest.
 * Notifies users assigned to that service type (UserServiceLead) via Notifications.serviceRequest.
 * If no user is assigned for that type, notifies platform admins.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { Notifications } from "@/lib/notifications";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rateLimit";
import type { ServiceRequestType } from "@prisma/client";

const SERVICE_REQUEST_TYPES: ServiceRequestType[] = [
  "ACCREDITATION_HELP",
  "ACCOUNTING_SERVICES",
  "MARKETING_WEBSITES",
  "GENERAL_INQUIRY",
];

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.STRICT);
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { "Retry-After": String(retryAfter), "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const service_type = typeof body?.service_type === "string" ? body.service_type.trim() : "";
    const full_name = typeof body?.full_name === "string" ? body.full_name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const organization = typeof body?.organization === "string" ? body.organization.trim() : null;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
    const message = typeof body?.message === "string" ? body.message.trim() : null;

    if (!SERVICE_REQUEST_TYPES.includes(service_type as ServiceRequestType)) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Invalid service_type. Must be one of: ${SERVICE_REQUEST_TYPES.join(", ")}`,
          400
        )
      );
    }
    if (!full_name || full_name.length < 2) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Full name is required (min 2 characters)", 400));
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Valid email is required", 400));
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        service_type: service_type as ServiceRequestType,
        full_name,
        email,
        organization: organization || null,
        phone: phone || null,
        message: message || null,
        status: "NEW",
      },
    });

    Notifications.serviceRequest(
      serviceRequest.id,
      service_type,
      { full_name, email, organization, message }
    ).catch((err) => {
      console.error("Service request notification failed (non-blocking):", err);
    });

    return Response.json({ success: true, id: serviceRequest.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/public/service-request error:", error);
    return fail(
      error instanceof AppError ? error : new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to submit request", 500)
    );
  }
}
