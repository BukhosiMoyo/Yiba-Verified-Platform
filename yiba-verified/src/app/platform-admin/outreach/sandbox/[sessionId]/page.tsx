import { SandboxSession, SandboxMessage } from "@/lib/outreach/sandbox/types";
import { getSandboxSession } from "../actions";
import { WorkspaceClient } from "../_components/WorkspaceClient";

export default async function SandboxWorkspace({ params }: { params: { sessionId: string } }) {
    // 1. Fetch Real Data
    const sessionData = await getSandboxSession(params.sessionId);

    if (!sessionData) return <div>Session not found</div>;

    // 2. Serialize Data (Date -> String) for Client Component
    // We cast to 'any' to bypass strict Date type checks since we are passing strings to the client
    // The client component handles string dates via new Date() or similar if needed.
    const session = {
        ...sessionData,
        created_at: sessionData.created_at.toISOString(),
        updated_at: sessionData.updated_at.toISOString(),
        last_activity_at: sessionData.last_activity_at.toISOString(),
    } as any;

    const messages = sessionData.messages.map(msg => ({
        ...msg,
        sent_at: msg.sent_at?.toISOString() ?? null,
        opened_at: msg.opened_at?.toISOString() ?? null,
        clicked_at: msg.clicked_at?.toISOString() ?? null,
        created_at: msg.created_at.toISOString(),
    })) as any;

    const events = sessionData.events.map(evt => ({
        ...evt,
        timestamp: evt.timestamp.toISOString(),
    })) as any;

    // 3. Render Client Wrapper for Interactivity
    return (
        <WorkspaceClient
            session={session}
            messages={messages}
            events={events}
        />
    );
}
