import { SandboxSession, SandboxMessage } from "@/lib/outreach/sandbox/types";
import { getSandboxSession } from "../actions";
import { WorkspaceClient } from "../_components/WorkspaceClient";

export default async function SandboxWorkspace({ params }: { params: { sessionId: string } }) {
    // 1. Fetch Real Data
    const sessionData = await getSandboxSession(params.sessionId);

    if (!sessionData) return <div>Session not found</div>;

    // 2. Cast to types (Prisma -> Interface)
    const session: SandboxSession = sessionData as any;
    const messages: SandboxMessage[] = sessionData.messages as any;
    const events = sessionData.events;

    // 3. Render Client Wrapper for Interactivity
    return (
        <WorkspaceClient
            session={session}
            messages={messages}
            events={events} // Pass events for log
        />
    );
}
