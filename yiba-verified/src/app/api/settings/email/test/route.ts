// POST /api/settings/email/test - Send test email (PLATFORM_ADMIN only)

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getEmailService } from "@/lib/email";
import { EmailType } from "@/lib/email/types";

export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only platform administrators can send test emails",
        403
      );
    }

    const body = await request.json().catch(() => ({}));
    const to = typeof body.to === "string" ? body.to.trim() : "";
    if (!to) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Missing or invalid 'to' email address", 400);
    }

    const emailService = getEmailService();
    const result = await emailService.send({
      to,
      type: EmailType.SYSTEM_ALERT,
      subject: "Yiba Verified – test email",
      html: "<p>This is a test email from Yiba Verified. If you received this, email sending is configured correctly.</p>",
      text: "This is a test email from Yiba Verified. If you received this, email sending is configured correctly.",
    });

    if (!result.success) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        result.error || "Failed to send test email",
        500
      );
    }

    return ok({ success: true, message: "Test email sent" });
  } catch (error) {
    return fail(error);
  }
}
