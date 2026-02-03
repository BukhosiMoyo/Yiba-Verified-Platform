// GET /api/settings/email - Email configuration (PLATFORM_ADMIN only)
// Returns provider, from address, and configured status. Does not expose API keys.

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only platform administrators can view email settings",
        403
      );
    }

    const provider = (process.env.EMAIL_PROVIDER || "console") as "resend" | "smtp" | "console";
    const fromEmail = process.env.EMAIL_FROM || "noreply@yibaverified.co.za";
    const fromName = process.env.EMAIL_FROM_NAME || "Yiba Verified";
    const replyTo = process.env.EMAIL_REPLY_TO ?? null;

    const configured =
      provider === "resend"
        ? !!process.env.RESEND_API_KEY
        : provider === "smtp"
          ? !!(process.env.SMTP_HOST && process.env.SMTP_USER)
          : false; // console = not configured for production

    return ok({
      provider: provider === "resend" ? "Resend" : provider === "smtp" ? "SMTP" : "Console",
      fromEmail,
      fromName,
      replyTo,
      configured,
    });
  } catch (error) {
    return fail(error);
  }
}
