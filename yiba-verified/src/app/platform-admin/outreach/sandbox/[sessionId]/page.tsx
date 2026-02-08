import { SandboxSession, SandboxMessage } from "@/lib/outreach/sandbox/types";
import { getSandboxSession } from "../actions";
import { WorkspaceClient } from "../_components/WorkspaceClient";

export default async function SandboxWorkspace({ params }: { params: Promise<{ sessionId: string }> }) {
    // 0. Await params (Next.js 15+)
    const { sessionId } = await params;

    // 1. Fetch Real Data
    const sessionData = await getSandboxSession(sessionId);

    if (!sessionData) return <div>Session not found</div>;

    // 2. Deep Serialize (The Nuclear Option) to ensure NO Date objects pass to client
    const serializedData = JSON.parse(JSON.stringify(sessionData));

    // 3. Render Client Wrapper
    return (
        <WorkspaceClient
            session={serializedData}
            messages={serializedData.messages}
            events={serializedData.events}
        />
    );
}
