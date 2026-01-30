"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Component that sends heartbeat requests to keep impersonation session alive
 * Should be included in layouts when user is impersonating
 */
export function ImpersonationHeartbeat() {
  const { data: session } = useSession();
  const impersonationSessionId = session?.user?.impersonationSessionId;

  useEffect(() => {
    if (!impersonationSessionId) {
      return; // Not impersonating, no heartbeat needed
    }

    const checkHeartbeat = async () => {
      try {
        const response = await fetch("/api/view-as/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json().catch(() => ({}));
        if (data.active === false) {
          window.location.href = "/logout";
          return;
        }
        if (!response.ok) {
          const err = (data?.error ?? "").toString();
          if (err.toLowerCase().includes("expired")) {
            window.location.href = "/logout";
          }
        }
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    };

    // Send heartbeat every 5 minutes
    const heartbeatInterval = setInterval(checkHeartbeat, 5 * 60 * 1000);

    checkHeartbeat();

    return () => clearInterval(heartbeatInterval);
  }, [impersonationSessionId]);

  return null; // This component doesn't render anything
}
