"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  // New state for logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Fetch settings AND Logo
    Promise.all([
      fetch("/api/settings/email").then(r => r.json()),
      fetch("/api/settings/logo").then(r => r.json())
    ])
      .then(([emailData, logoData]) => {
        if (cancelled) return;

        if (emailData.error) {
          setError(emailData.error);
          // Don't return, allow logo to load if email fails? No, block both for simplicity or handle gracefully
        } else {
          setConfig({
            provider: emailData.provider ?? "—",
            fromEmail: emailData.fromEmail ?? "—",
            fromName: emailData.fromName ?? "—",
            replyTo: emailData.replyTo ?? null,
            configured: !!emailData.configured,
          });
        }

        if (logoData && logoData.logoUrl) {
          setLogoUrl(logoData.logoUrl);
        }
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setLogoUrl(data.url);
      toast.success("Logo uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm("Are you sure you want to remove the custom logo?")) return;

    try {
      const res = await fetch("/api/settings/logo", { method: "DELETE" });
      if (res.ok) {
        setLogoUrl(null);
        toast.success("Logo removed");
      } else {
        toast.error("Failed to remove logo");
      }
    } catch (e) {
      toast.error("Failed to remove logo");
    }
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Branding</CardTitle>
              <CardDescription>Customize the appearance of system emails.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email Logo</Label>
              <div className="flex flex-col gap-3">
                {logoUrl ? (
                  <div className="relative w-full max-w-[200px] h-20 border rounded-md flex items-center justify-center bg-gray-50 p-2 overflow-hidden">
                    <img src={logoUrl} alt="Email Logo" className="max-h-full max-w-full object-contain" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={handleRemoveLogo}
                    >
                      <span className="sr-only">Remove</span>
                      &times;
                    </Button>
                  </div>
                ) : (
                  <div className="w-full max-w-[200px] h-20 border border-dashed rounded-md flex items-center justify-center text-muted-foreground text-xs bg-muted/20">
                    No custom logo
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="max-w-[250px]"
                  />
                  {uploadingLogo && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Upload a logo (PNG or JPG) to be used in email headers. Recommended height: 40-60px.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
