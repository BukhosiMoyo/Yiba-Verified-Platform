"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

type EmailConfig = {
  provider: string;
  fromEmail: string;
  fromName: string;
  replyTo: string | null;
  configured: boolean;
};

export function EmailSettingsSection() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/settings/email")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        setConfig({
          provider: data.provider ?? "—",
          fromEmail: data.fromEmail ?? "—",
          fromName: data.fromName ?? "—",
          replyTo: data.replyTo ?? null,
          configured: !!data.configured,
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSendTest = async () => {
    const to = testTo.trim();
    if (!to) {
      toast.error("Enter an email address");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send test email");
        return;
      }
      toast.success("Test email sent");
      setTestTo("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">Provider</span>
        <span className="text-sm text-muted-foreground">{config?.provider ?? "—"}</span>
        {config?.configured ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Configured
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Not configured
          </span>
        )}
      </div>
      <div>
        <span className="text-sm font-medium text-foreground">From</span>
        <p className="text-sm text-muted-foreground">
          {config?.fromName} &lt;{config?.fromEmail}&gt;
        </p>
      </div>
      {config?.replyTo != null && config.replyTo !== "" && (
        <div>
          <span className="text-sm font-medium text-foreground">Reply-to</span>
          <p className="text-sm text-muted-foreground">{config.replyTo}</p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        API key and from address are set via environment variables (e.g.{" "}
        <code className="rounded bg-border px-1">RESEND_API_KEY</code>,{" "}
        <code className="rounded bg-border px-1">EMAIL_FROM</code>).
      </p>
      <div className="border-t border-border pt-4">
        <Label htmlFor="test-to" className="text-foreground">
          Send test email
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input
            id="test-to"
            type="email"
            placeholder="you@example.com"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            className="max-w-xs border-border bg-background text-foreground"
          />
          <Button
            type="button"
            onClick={handleSendTest}
            disabled={sending}
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send test
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
