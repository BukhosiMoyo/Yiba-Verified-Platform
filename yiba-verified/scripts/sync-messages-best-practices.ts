/**
 * Sync Messages – Best Practices Script
 *
 * Ensures chat/messaging data follows best practices:
 *
 * 1. Conversation.lastMessageAt & lastMessageText
 *    – Backfill from the latest non-deleted Message per conversation.
 *    – Keeps list previews and sort order correct (denormalized preview).
 *    – lastMessageText is trimmed to 100 chars + "..." to match API behavior.
 *
 * 2. ConversationMember.lastReadMsgId
 *    – Set to the latest message at or before lastReadAt (read receipt consistency).
 *    – Ensures "read up to" aligns with lastReadAt for clients that use lastReadMsgId.
 *
 * 3. Idempotent and safe to run multiple times; uses Prisma transactions for consistency.
 *
 * Usage:
 *   npm run sync:messages
 *   npm run sync:messages:dry   # preview only, no writes
 *
 * Or:
 *   npx tsx scripts/sync-messages-best-practices.ts
 *   DRY_RUN=1 npx tsx scripts/sync-messages-best-practices.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const MAX_PREVIEW_LENGTH = 100;

function previewText(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= MAX_PREVIEW_LENGTH) return trimmed;
  return trimmed.slice(0, MAX_PREVIEW_LENGTH) + "...";
}

async function main() {
  console.log("Sync Messages (best practices)\n");
  if (DRY_RUN) {
    console.log("DRY RUN – no changes will be written.\n");
  }

  // ─── 1. Backfill Conversation.lastMessageAt & lastMessageText from latest Message ───
  const conversations = await prisma.conversation.findMany({
    select: { id: true, lastMessageAt: true, lastMessageText: true },
  });

  const latestMessages = await prisma.message.findMany({
    where: { deletedAt: null },
    orderBy: [{ conversationId: "asc" }, { createdAt: "desc" }],
    select: { id: true, conversationId: true, content: true, createdAt: true },
  });

  const latestByConversation = new Map<
    string,
    { id: string; content: string; createdAt: Date }
  >();
  for (const msg of latestMessages) {
    if (!latestByConversation.has(msg.conversationId)) {
      latestByConversation.set(msg.conversationId, {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
      });
    }
  }

  const toUpdateConversations: Array<{
    id: string;
    lastMessageAt: Date;
    lastMessageText: string;
  }> = [];

  for (const conv of conversations) {
    const latest = latestByConversation.get(conv.id);
    if (!latest) continue;

    const needsUpdate =
      conv.lastMessageAt?.getTime() !== latest.createdAt.getTime() ||
      conv.lastMessageText !== previewText(latest.content);

    if (needsUpdate) {
      toUpdateConversations.push({
        id: conv.id,
        lastMessageAt: latest.createdAt,
        lastMessageText: previewText(latest.content),
      });
    }
  }

  if (toUpdateConversations.length > 0) {
    console.log(
      `Conversations: updating lastMessageAt/lastMessageText for ${toUpdateConversations.length} row(s).`
    );
    if (!DRY_RUN) {
      await prisma.$transaction(
        toUpdateConversations.map((c) =>
          prisma.conversation.update({
            where: { id: c.id },
            data: {
              lastMessageAt: c.lastMessageAt,
              lastMessageText: c.lastMessageText,
            },
          })
        )
      );
    }
  } else {
    console.log("Conversations: all already in sync (lastMessageAt/lastMessageText).");
  }

  // ─── 2. Optional: sync ConversationMember.lastReadMsgId from lastReadAt ───
  const membersWithLastRead = await prisma.conversationMember.findMany({
    where: { lastReadAt: { not: null }, leftAt: null },
    select: {
      id: true,
      conversationId: true,
      userId: true,
      lastReadAt: true,
      lastReadMsgId: true,
    },
  });

  const memberUpdates: Array<{
    id: string;
    lastReadMsgId: string;
  }> = [];

  for (const member of membersWithLastRead) {
    const lastReadAt = member.lastReadAt!;
    const latestAtOrBefore = await prisma.message.findFirst({
      where: {
        conversationId: member.conversationId,
        createdAt: { lte: lastReadAt },
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (
      latestAtOrBefore &&
      latestAtOrBefore.id !== member.lastReadMsgId
    ) {
      memberUpdates.push({ id: member.id, lastReadMsgId: latestAtOrBefore.id });
    }
  }

  if (memberUpdates.length > 0) {
    console.log(
      `ConversationMember: syncing lastReadMsgId for ${memberUpdates.length} row(s).`
    );
    if (!DRY_RUN) {
      await prisma.$transaction(
        memberUpdates.map((m) =>
          prisma.conversationMember.update({
            where: { id: m.id },
            data: { lastReadMsgId: m.lastReadMsgId },
          })
        )
      );
    }
  } else {
    console.log("ConversationMember: lastReadMsgId already in sync (or no members with lastReadAt).");
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
