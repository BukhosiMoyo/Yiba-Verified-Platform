"use client";

import { useState } from "react";
import { Eye, Copy, Check, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";

type GenerateImpersonationLinkProps = {
  targetUserId: string;
  targetUserName: string;
  targetUserRole: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

/**
 * Component for generating impersonation login links
 * Similar to hosting company "Login as User" functionality
 */
export function GenerateImpersonationLink({
  targetUserId,
  targetUserName,
  targetUserRole,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: GenerateImpersonationLinkProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [fullUrl, setFullUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setLink(null);
      setFullUrl(null);
      setExpiresAt(null);

      const response = await fetch("/api/view-as/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/a3a957bf-fd91-43b2-abbc-191f81673693", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "GenerateImpersonationLink.tsx:handleGenerate:!response.ok",
            message: "API error response",
            data: {
              status: response.status,
              statusText: response.statusText,
              errorMessage: errorData?.message ?? null,
              hypothesisId: "H5",
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
          }),
        }).catch(() => {});
        // #endregion
        throw new Error(errorData.message || "Failed to generate link");
      }

      const data = await response.json();
      setLink(data.link);
      setFullUrl(data.fullUrl);
      setExpiresAt(data.expiresAt);

      toast.success("Impersonation link generated");
    } catch (err: any) {
      console.error("Failed to generate impersonation link:", err);
      setError(err.message || "Failed to generate link");
      toast.error(err.message || "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!fullUrl) return;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy link");
    }
  };

  const handleOpenInNewWindow = () => {
    if (!fullUrl) return;

    // Open in new window (user can manually use incognito if desired)
    const newWindow = window.open(fullUrl, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      toast.error("Popup blocked. Please allow popups or copy the link manually.");
    } else {
      toast.success("Opening in new window");
      setOpen(false);
    }
  };

  const formatExpiry = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} minutes`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size === "md" ? "default" : size}>
          <Eye className="h-3 w-3 mr-2" />
          {showLabel && "Generate Login Link"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Login Link</DialogTitle>
          <DialogDescription>
            Create a secure, expiring login link for {targetUserName} ({targetUserRole}).
            The link will expire after 1 hour or 15 minutes of inactivity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="error" icon={<AlertCircle className="h-4 w-4" />} description={error} />
          )}

          {!link ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Click "Generate Link" to create a secure login link for this user.
              </p>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Generate Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Login Link</Label>
                <div className="flex gap-2">
                  <Input value={fullUrl || ""} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {expiresAt && (
                <div className="text-sm text-muted-foreground">
                  <p>Expires in: {formatExpiry(expiresAt)}</p>
                  <p className="text-xs mt-1">
                    Link will also expire after 15 minutes of inactivity
                  </p>
                </div>
              )}

              <Alert
                description={
                  <span className="text-xs">
                    <strong>Tip:</strong> For privacy, open this link in an incognito/private window.
                    The link provides full access to this user's account.
                  </span>
                }
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {link && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={handleOpenInNewWindow}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Window
              </Button>
            </>
          )}
          {!link && (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
