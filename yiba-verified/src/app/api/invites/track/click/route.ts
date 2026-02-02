// GET /api/invites/track/click - Track email link clicks
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

/**
 * GET /api/invites/track/click
 * Tracks when a user clicks a link in the invite email
 * 
 * Query params:
 * - rid: Recipient ID (invite_id)
 * - to: Destination URL (encoded)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const inviteId = searchParams.get("rid");
    const to = searchParams.get("to");

    // Default fallback URL if 'to' is missing or invalid
    const fallbackUrl = process.env.NEXT_PUBLIC_BASE_URL || "/";
    const destinationUrl = to ? decodeURIComponent(to) : fallbackUrl;

    if (inviteId) {
      const invite = await prisma.invite.findUnique({
        where: { invite_id: inviteId },
      });

      if (invite) {
        // 1. Log Click Event
        await prisma.inviteEvent.create({
          data: {
            invite_id: invite.invite_id,
            campaign_id: invite.campaign_id,
            type: "CLICKED",
            metadata: {
              url: destinationUrl,
              ip: request.headers.get("x-forwarded-for") || "unknown",
              user_agent: request.headers.get("user-agent") || "unknown",
            },
          },
        });

        // 2. Update Invite Status if first click
        // If it was just SENT or OPENED, now it's CLICKED (unless already ACCEPTED)
        if (!invite.clicked_at) {
          await prisma.invite.update({
            where: { invite_id: invite.invite_id },
            data: {
              // We don't have a CLICKED status in the Enum, so we ensure it's at least OPENED
              // If it's already ACCEPTED, keep it.
              status: invite.status === "ACCEPTED" ? "ACCEPTED" : "OPENED",
              clicked_at: new Date(),
              // Also mark as opened if not already
              opened_at: invite.opened_at || new Date(),
            },
          });

          // 3. Update Campaign Stats (Unique clicks)
          if (invite.campaign_id) {
            const campaignUpdateData: any = {
              clicked_count: { increment: 1 },
            };

            // If this implicitly counts as an open too (and wasn't counted yet)
            if (!invite.opened_at) {
              campaignUpdateData.opened_count = { increment: 1 };
            }

            await prisma.inviteCampaign.update({
              where: { campaign_id: invite.campaign_id },
              data: campaignUpdateData,
            });
          }
        } else if (!invite.opened_at) {
          // Even if clicked before, if opened_at was null, set it now.
          await prisma.invite.update({
            where: { invite_id: invite.invite_id },
            data: { opened_at: new Date() },
          });
          if (invite.campaign_id) {
            await prisma.inviteCampaign.update({
              where: { campaign_id: invite.campaign_id },
              data: { opened_count: { increment: 1 } },
            });
          }
        }
      }
    }

    // Redirect to destination
    return NextResponse.redirect(destinationUrl);
  } catch (error) {
    console.error("Click tracking error:", error);
    // On error, still try to redirect to home/fallback
    return NextResponse.redirect(process.env.NEXT_PUBLIC_BASE_URL || "/");
  }
}
