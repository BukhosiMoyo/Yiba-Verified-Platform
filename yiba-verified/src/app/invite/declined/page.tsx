import { Suspense } from "react";
import { InviteDeclinedClient } from "./InviteDeclinedClient";

export default function InviteDeclinedPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>}>
      <InviteDeclinedClient />
    </Suspense>
  );
}
