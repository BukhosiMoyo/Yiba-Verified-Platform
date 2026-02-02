import { prisma } from "@/lib/prisma";
import { getEmailService } from "@/lib/email";

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;

export async function processEmailQueue() {
    const emailService = getEmailService();

    // 1. Fetch pending items
    // Priority: HIGH first, then NORMAL, then LOW
    // (Prisma sort doesn't support custom sort order easily without raw query or multiple queries, 
    // so we'll just fetch by created_at which is good enough for FIFO usually, 
    // but let's do two queries if we really care about Priority. 
    // Actually, 'created_at' is good enough for now, or we can add an index on priority later.)

    // Better approach: fetch all pending, order by priority (if enum maps to string, might not sort how we want).
    // Let's keep it simple: FIFO for now.

    const pendingItems = await prisma.emailQueue.findMany({
        where: {
            status: "PENDING",
            attempts: { lt: MAX_RETRIES }
        },
        take: BATCH_SIZE,
        orderBy: { created_at: "asc" }
    });

    if (pendingItems.length === 0) {
        return { processed: 0, errors: 0 };
    }

    let processedCount = 0;
    let errorCount = 0;

    console.log(`[EmailWorker] Processing ${pendingItems.length} emails...`);

    for (const item of pendingItems) {
        try {
            // Mark as PROCESSING (optional, but good for concurrency if multiple workers)
            // Since we're likely running this on Vercel Cron (single invocation usually), 
            // simple "lock" conceptually isn't strictly needed unless high scale.
            // But let's increment attempts here.
            await prisma.emailQueue.update({
                where: { id: item.id },
                data: {
                    attempts: { increment: 1 },
                    last_attempt_at: new Date()
                }
            });

            // Send
            const result = await emailService.send({
                to: item.to_email,
                subject: item.subject,
                html: item.body_html || `<p>${item.body_text}</p>`, // Fallback
                text: item.body_text || undefined
            });

            if (result.success) {
                await prisma.emailQueue.update({
                    where: { id: item.id },
                    data: {
                        status: "SENT",
                        sent_at: new Date()
                    }
                });
                processedCount++;
            } else {
                throw new Error(result.error || "Unknown send error");
            }

        } catch (error: any) {
            console.error(`[EmailWorker] Failed to send email ${item.id}:`, error);
            errorCount++;

            // Update status to FAILED if max retries reached, else stays PENDING (but attempts incremented)
            // Actually we should see if attempts >= MAX_RETRIES, we set to FAILED
            const isFinalFailure = (item.attempts + 1) >= MAX_RETRIES;

            await prisma.emailQueue.update({
                where: { id: item.id },
                data: {
                    status: isFinalFailure ? "FAILED" : "PENDING",
                    error_message: error.message || String(error)
                }
            });
        }
    }

    return { processed: processedCount, errors: errorCount };
}
