"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Monitor, Smartphone } from "lucide-react";
import { buildInviteEmailFromTemplate } from "@/lib/email/templates/inviteTemplates";
import type { EmailTemplate } from "@prisma/client";

const SAMPLE_CONTEXT = {
  recipient_name: "Jane",
  institution_name: "Acme College",
  inviter_name: "Dr. Smith",
  role: "Institution Admin",
  invite_link: "https://app.example.com/invite?token=sample",
  action_url: "https://app.example.com/invite?token=sample",
  expiry_date: "7 February 2026",
};

export function EmailTemplatePreviewModal({
  type,
  onClose,
}: {
  type: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/email-templates/${encodeURIComponent(type)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const template = data as EmailTemplate;
        const trackedLink = "https://app.example.com/invite?token=sample";
        const trackingPixelUrl = "https://app.example.com/pixel.gif";
        const built = buildInviteEmailFromTemplate(
          template,
          SAMPLE_CONTEXT,
          trackedLink,
          trackingPixelUrl,
          null
        );
        setSubject(built.subject);
        setHtml(built.html);
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
  }, [type]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden border-border bg-card flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">Preview email</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
          <p className="text-sm text-muted-foreground truncate" title={subject}>
            Subject: {subject || "—"}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant={previewMode === "desktop" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("desktop")}
              aria-label="Desktop preview"
            >
              <Monitor className="h-4 w-4 mr-1" />
              Desktop
            </Button>
            <Button
              variant={previewMode === "mobile" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("mobile")}
              aria-label="Mobile preview"
            >
              <Smartphone className="h-4 w-4 mr-1" />
              Mobile
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-destructive py-4">{error}</p>
        ) : html ? (
          <div
            className="flex-1 min-h-0 overflow-auto rounded border border-border bg-muted/20"
            style={{
              maxWidth: previewMode === "mobile" ? 375 : "100%",
              margin: previewMode === "mobile" ? "0 auto" : undefined,
            }}
          >
            <iframe
              title="Email preview"
              srcDoc={html}
              className="w-full border-0 min-h-[480px] bg-white dark:bg-gray-900"
              style={{
                height: "min(70vh, 600px)",
                width: previewMode === "desktop" ? "100%" : 375,
              }}
              sandbox="allow-same-origin"
            />
          </div>
        ) : null}
        <div className="border-t border-border pt-4">
          <Button variant="outline" onClick={onClose} className="border-border">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
