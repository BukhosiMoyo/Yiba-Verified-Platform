import { SandboxSession, SandboxMessage } from "@/lib/outreach/sandbox/types";
import { getSandboxSession } from "../actions";
import { WorkspaceClient } from "../_components/WorkspaceClient";

export default async function SandboxWorkspace({ params }: { params: { sessionId: string } }) {
    // 1. Fetch Real Data
    const sessionData = await getSandboxSession(params.sessionId);

    if (!sessionData) return <div>Session not found</div>;

    if (!sessionData) return <div>Session not found</div>;

    // 2. Separate Relations & Serialize
    // Destructure to separate the relational arrays (which have Dates) from the main session fields
    const { messages: rawMessages, events: rawEvents, ...sessionFields } = sessionData;

    // Serialize Session Fields
    const session = {
        ...sessionFields,
        created_at: sessionFields.created_at.toISOString(),
        updated_at: sessionFields.updated_at.toISOString(),
        last_activity_at: sessionFields.last_activity_at.toISOString(),
    } as any;

    // Serialize Messages
    const messages = rawMessages.map(msg => ({
        ...msg,
        sent_at: msg.sent_at?.toISOString() ?? null,
        opened_at: msg.opened_at?.toISOString() ?? null,
        clicked_at: msg.clicked_at?.toISOString() ?? null,
        created_at: msg.created_at.toISOString(),
    })) as any;

    // Serialize Events
    const events = rawEvents.map(evt => ({
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
