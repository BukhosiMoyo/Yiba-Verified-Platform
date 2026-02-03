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

  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { Separator } from "@/components/ui/separator";

  // ... (keep state and accessors)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6 text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Current email provider settings.</CardDescription>
          </div>
          {config?.configured ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Configured</Badge>
          ) : (
            <Badge variant="destructive">Not Configured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Provider</span>
            <p className="font-medium">{config?.provider ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">From Address</span>
            <p className="font-medium">{config?.fromName} &lt;{config?.fromEmail}&gt;</p>
          </div>
          {config?.replyTo && (
            <div className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-muted-foreground">Reply-To</span>
              <p className="font-medium">{config.replyTo}</p>
            </div>
          )}
        </div>

        <div className="rounded-md bg-muted p-4 text-xs text-muted-foreground">
          Settings are managed via environment variables (e.g. <code className="font-semibold text-foreground">RESEND_API_KEY</code>, <code className="font-semibold text-foreground">EMAIL_FROM</code>).
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Test Configuration</h4>
            <p className="text-sm text-muted-foreground">Send a test email to verify your settings.</p>
          </div>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
            <Button onClick={handleSendTest} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
