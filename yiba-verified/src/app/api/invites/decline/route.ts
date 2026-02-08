// POST /api/invites/decline - Decline an invite (optional reason)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { createHash } from "crypto";

const VALID_DECLINE_REASONS = [
  "already_using_other_platform",
  "not_responsible",
  "not_interested",
  "other",
] as const;

/**
 * POST /api/invites/decline
 * Body: { token: string, reason?: string, reason_other?: string }
 * Marks invite as DECLINED and stores optional feedback.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.token;
    const reason = body.reason;
    const reasonOther = body.reason_other;

    if (!token || typeof token !== "string") {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Token is required", 400);
    }

    if (reason != null && !VALID_DECLINE_REASONS.includes(reason)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid reason. Must be one of: ${VALID_DECLINE_REASONS.join(", ")}`,
        400
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const invite = await prisma.invite.findUnique({
      where: {
        token_hash: tokenHash,
        deleted_at: null,
      },
      include: {
        institution: true,
      },
    });

    if (!invite) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Invalid invite token", 404);
    }

    if (invite.used_at || invite.accepted_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "This invite has already been used",
        400
      );
    }

    if (invite.declined_at) {
      return ok({ success: true, message: "Invite already declined" });
    }

    if (new Date() > invite.expires_at) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "This invite has expired", 400);
    }

    // Trigger AI Response
    let aiHistoryEntry = null;
    let aiResponse = null;

    // Only trigger if we have context
    if (invite.institution) {
      try {
        const { generateResponse, ResponseContext } = await import("@/lib/ai/responseEngine");
        const { AIResponseTrigger } = await import("@/lib/outreach/types");

        const trigger = (reason || reasonOther)
          ? AIResponseTrigger.DECLINE_WITH_REASON
          : AIResponseTrigger.DECLINE_NO_REASON;

        // Use simplified type since we don't import the full Profile type here easily
        const context = {
          institutionName: invite.institution.trading_name || invite.institution.legal_name || "Valued Institution",
          recipientName: "Colleague",
          role: invite.role,
          currentStage: invite.engagement_state,
          trigger: trigger,
          payload: { reason, reasonOther },
          interactionHistory: JSON.stringify(invite.engagement_history || [])
        };

        aiResponse = await generateResponse(context);

        if (aiResponse) {
          aiHistoryEntry = {
            timestamp: new Date().toISOString(),
            event: "AI_RESPONSE_GENERATED",
            scoreDelta: 0,
            metadata: {
              trigger_type: trigger,
              stage_at_time: invite.engagement_state,
              strategy_used: aiResponse.strategy_used,
              generated_content: {
                subject: aiResponse.subject,
                preview: aiResponse.preview_text
              }
            }
          };
        }
      } catch (e) {
        console.error("AI Generation Error:", e);
      }
    }

    const currentHistory = (invite.engagement_history as any[]) || [];
    if (aiHistoryEntry) {
      currentHistory.push(aiHistoryEntry);
    }

    // Add Decline Event to history too
    currentHistory.push({
      timestamp: new Date().toISOString(),
      event: "INVITE_DECLINED",
      scoreDelta: -50,
      metadata: { reason, reasonOther }
    });

    await prisma.invite.update({
      where: { invite_id: invite.invite_id },
      data: {
        status: "DECLINED", // Assuming InviteStatus has DECLINED or string
        engagement_state: "DECLINED", // Update engagement state
        engagement_history: currentHistory,
        declined_at: new Date(),
        decline_reason: reason ?? null,
        decline_reason_other: reasonOther ?? null,
      },
    });

    return ok({ success: true, message: "Invite declined", ai_response: !!aiResponse });
  } catch (error) {
    return fail(error);
  }
}
