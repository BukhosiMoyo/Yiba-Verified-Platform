"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { AlertTriangle, Clock, LogOut } from "lucide-react";
import { toast } from "sonner";

/**
 * Component that shows warning popups for impersonation session expiration
 * - Warns when approaching 1 hour expiration (5 minutes remaining)
 * - Warns when approaching inactivity timeout (5 minutes of inactivity = 10 minutes remaining)
 * - Shows countdown timers
 */
export function ImpersonationSessionWarning() {
  const { data: session } = useSession();
  const impersonationSessionId = session?.user?.impersonationSessionId;

  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [inactivityTimeRemaining, setInactivityTimeRemaining] = useState<number>(0);
  const [expirationWarningDismissedUntil, setExpirationWarningDismissedUntil] = useState<Date | null>(null);
  const [inactivityWarningDismissedUntil, setInactivityWarningDismissedUntil] = useState<Date | null>(null);

  // Configuration
  const INACTIVITY_TIMEOUT_SECONDS = 15 * 60; // 15 minutes
  const EXPIRATION_WARNING_SECONDS = 5 * 60; // Warn 5 minutes before expiration
  const INACTIVITY_WARNING_SECONDS = 5 * 60; // Warn after 5 minutes of inactivity

  // Fetch session info
  useEffect(() => {
    if (!impersonationSessionId) {
      return;
    }

    const fetchSessionInfo = async () => {
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
        if (response.ok && data.expiresAt) {
          setExpiresAt(new Date(data.expiresAt));
        }
        if (response.ok && data.lastActivity) {
          setLastActivity(new Date(data.lastActivity));
        }
      } catch (error) {
        console.error("Failed to fetch session info:", error);
      }
    };

    fetchSessionInfo();
    // Refresh session info every minute
    const interval = setInterval(fetchSessionInfo, 60 * 1000);
    return () => clearInterval(interval);
  }, [impersonationSessionId]);

  // Track user activity (mouse, keyboard, scroll)
  useEffect(() => {
    if (!impersonationSessionId) {
      return;
    }

    let activityTimeout: NodeJS.Timeout | null = null;

    const updateActivity = () => {
      const now = new Date();
      setLastActivity(now);
      
      // Debounce heartbeat - only send every 30 seconds to avoid too many requests
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      activityTimeout = setTimeout(() => {
        fetch("/api/view-as/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.active === false) {
              window.location.href = "/logout";
              return;
            }
            if (data.lastActivity) {
              setLastActivity(new Date(data.lastActivity));
            }
          })
          .catch(console.error);
      }, 30000); // 30 seconds debounce
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [impersonationSessionId]);

  // Calculate time remaining and show warnings
  useEffect(() => {
    if (!impersonationSessionId || !expiresAt || !lastActivity) {
      return;
    }

    const updateTimers = () => {
      const now = new Date();

      // Calculate time until expiration
      const msUntilExpiration = expiresAt.getTime() - now.getTime();
      const secondsUntilExpiration = Math.max(0, Math.floor(msUntilExpiration / 1000));
      setTimeRemaining(secondsUntilExpiration);

      // Calculate inactivity time
      const msSinceActivity = now.getTime() - lastActivity.getTime();
      const secondsSinceActivity = Math.floor(msSinceActivity / 1000);
      const secondsUntilInactivityTimeout = Math.max(0, INACTIVITY_TIMEOUT_SECONDS - secondsSinceActivity);
      setInactivityTimeRemaining(secondsUntilInactivityTimeout);

      // Show expiration warning (5 minutes before expiration)
      // But only if not dismissed recently (within last 2 minutes)
      const isExpirationWarningDismissed = expirationWarningDismissedUntil && now < expirationWarningDismissedUntil;
      if (secondsUntilExpiration > 0 && secondsUntilExpiration <= EXPIRATION_WARNING_SECONDS && !isExpirationWarningDismissed) {
        setShowExpirationWarning(true);
      } else {
        setShowExpirationWarning(false);
      }

      // Show inactivity warning (after 5 minutes of inactivity = 10 minutes remaining)
      // But only if not dismissed recently (within last 2 minutes)
      const isInactivityWarningDismissed = inactivityWarningDismissedUntil && now < inactivityWarningDismissedUntil;
      if (secondsSinceActivity >= INACTIVITY_WARNING_SECONDS && secondsUntilInactivityTimeout > 0 && !isInactivityWarningDismissed) {
        setShowInactivityWarning(true);
      } else {
        setShowInactivityWarning(false);
      }

      // Auto-logout if expired
      if (secondsUntilExpiration <= 0 || secondsUntilInactivityTimeout <= 0) {
        toast.error("Your impersonation session has expired");
        setTimeout(() => {
          window.location.href = "/logout";
        }, 2000);
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000); // Update every second
    return () => clearInterval(interval);
  }, [impersonationSessionId, expiresAt, lastActivity]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!impersonationSessionId) {
    return null; // Not impersonating
  }

  return (
    <>
      {/* Expiration Warning (1 hour limit) */}
      <Dialog 
        open={showExpirationWarning} 
        onOpenChange={(open) => {
          // Allow closing the dialog
          if (!open) {
            setShowExpirationWarning(false);
            // Dismiss warning for 2 minutes to prevent immediate re-showing
            setExpirationWarningDismissedUntil(new Date(Date.now() + 2 * 60 * 1000));
          } else {
            setShowExpirationWarning(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Session Expiring Soon
            </DialogTitle>
            <DialogDescription>
              Your impersonation session will expire in {formatTime(timeRemaining)}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="warning" description="The session will automatically end after 1 hour. You will be redirected to your admin dashboard." />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowExpirationWarning(false);
                // Dismiss warning for 2 minutes
                setExpirationWarningDismissedUntil(new Date(Date.now() + 2 * 60 * 1000));
                // Refresh session info to get updated expiration
                fetch("/api/view-as/heartbeat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.active === false) {
                      window.location.href = "/logout";
                      return;
                    }
                    if (data.expiresAt) setExpiresAt(new Date(data.expiresAt));
                  })
                  .catch(console.error);
              }}
            >
              Continue Session
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/logout";
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              End Session Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inactivity Warning (15 minute timeout) */}
      <Dialog 
        open={showInactivityWarning} 
        onOpenChange={(open) => {
          // Allow closing the dialog
          if (!open) {
            setShowInactivityWarning(false);
            // Dismiss warning for 2 minutes to prevent immediate re-showing
            setInactivityWarningDismissedUntil(new Date(Date.now() + 2 * 60 * 1000));
            setLastActivity(new Date());
            fetch("/api/view-as/heartbeat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            })
              .then((res) => res.json())
              .then((data) => { if (data.active === false) window.location.href = "/logout"; })
              .catch(console.error);
          } else {
            setShowInactivityWarning(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Inactivity Warning
            </DialogTitle>
            <DialogDescription>
              You've been inactive for a while. The session will expire in {formatTime(inactivityTimeRemaining)} due to inactivity.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="warning" description="Move your mouse or press a key to keep the session alive. After 15 minutes of inactivity, the session will automatically end." />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                // Update activity
                setLastActivity(new Date());
                setShowInactivityWarning(false);
                setInactivityWarningDismissedUntil(new Date(Date.now() + 2 * 60 * 1000));
                fetch("/api/view-as/heartbeat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                })
                  .then((res) => res.json())
                  .then((data) => { if (data.active === false) window.location.href = "/logout"; })
                  .catch(console.error);
              }}
            >
              Continue Session
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/logout";
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              End Session Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
