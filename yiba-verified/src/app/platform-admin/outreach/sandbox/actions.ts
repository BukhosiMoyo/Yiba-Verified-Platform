'use server';

import * as SandboxEngine from '@/lib/outreach/sandbox/sandboxEngine';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { OutreachEventType } from '@/lib/outreach/types';

/**
 * Creates a new sandbox session and redirects to it.
 */
export async function createSandboxSession(name: string, userId: string): Promise<void> {
    const session = await SandboxEngine.createSession(name, userId);
    revalidatePath('/platform-admin/outreach/sandbox');
    redirect(`/platform-admin/outreach/sandbox/${session.session_id}`);
}

/**
 * Fetches all sandbox sessions.
 */
export async function getSandboxSessions() {
    // @ts-ignore
    return prisma.outreachSandboxSession.findMany({
        orderBy: { created_at: 'desc' }
    });
}

/**
 * Fetches a single session with related data.
 */
export async function getSandboxSession(sessionId: string) {
    // @ts-ignore
    const session = await prisma.outreachSandboxSession.findUnique({
        where: { session_id: sessionId },
        include: {
            messages: { orderBy: { created_at: 'desc' } },
            events: { orderBy: { timestamp: 'desc' } }
        }
    });
    return session;
}

/**
 * Triggers an event (Open, Click, etc) in isolation.
 */
export async function simulateEvent(sessionId: string, eventType: OutreachEventType, metadata: any = {}) {
    await SandboxEngine.triggerSandboxEvent(sessionId, eventType, metadata);
    revalidatePath(`/platform-admin/outreach/sandbox/${sessionId}`);
}

/**
 * Generates the next AI draft message.
 */
export async function generateNextMessage(sessionId: string) {
    await SandboxEngine.generateSandboxDraft(sessionId);
    revalidatePath(`/platform-admin/outreach/sandbox/${sessionId}`);
}

/**
 * Advances time (Simulates decay/scheduler).
 */
export async function advanceTime(sessionId: string, daysCallback: number) {
    // In a real impl, this would shift dates and run checking jobs.
    // For now, we just log it and maybe decay score.
    await SandboxEngine.triggerSandboxEvent(sessionId, 'SYSTEM_NOTE' as any, {
        description: `Time advanced by ${daysCallback} days`,
        daysSkipped: daysCallback
    });
    revalidatePath(`/platform-admin/outreach/sandbox/${sessionId}`);
}

/**
 * Resets the session.
 */
export async function resetSession(sessionId: string) {
    await SandboxEngine.resetSession(sessionId);
    revalidatePath(`/platform-admin/outreach/sandbox/${sessionId}`);
}

/**
 * Simulates a conversion/signup.
 */
export async function simulateConversion(sessionId: string) {
    await SandboxEngine.convertSession(sessionId);
    revalidatePath(`/platform-admin/outreach/sandbox/${sessionId}`);
}

/**
 * Deletes a session.
 */
export async function deleteSession(sessionId: string) {
    await prisma.outreachSandboxMessage.deleteMany({ where: { session_id: sessionId } });
    await prisma.outreachSandboxEvent.deleteMany({ where: { session_id: sessionId } });
    // @ts-ignore
    await prisma.outreachSandboxSession.delete({
        where: { session_id: sessionId }
    });
    revalidatePath('/platform-admin/outreach/sandbox');
}
