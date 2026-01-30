"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { INVITE_PLACEHOLDERS } from "@/lib/email/templates/placeholders";

type TemplateData = {
  id: string;
  type: string;
  name: string;
  subject: string;
  header_html: string | null;
  body_sections: unknown;
  cta_text: string | null;
  footer_html: string | null;
  is_active: boolean;
  updated_at: string;
};

type BodySection = { type?: string; content?: string };

export function EmailTemplateViewModal({
  type,
  usedBy,
  triggerEvent,
  onClose,
}: {
  type: string;
  usedBy: string;
  triggerEvent: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateData | null>(null);

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
        setTemplate(data as TemplateData);
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

  const bodySections = template?.body_sections;
  const bodyBlocks = Array.isArray(bodySections)
    ? (bodySections as BodySection[]).map((s) => (typeof s?.content === "string" ? s.content : ""))
    : [];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">View email template</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : template ? (
          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Used by</p>
              <p className="text-foreground">{usedBy}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Trigger event</p>
              <p className="text-foreground">{triggerEvent}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <p className="text-foreground">{template.is_active ? "Active" : "Disabled"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Subject</p>
              <p className="text-foreground">{template.subject || "—"}</p>
            </div>
            {template.header_html && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Header</p>
                <div className="mt-1 rounded border border-border bg-muted/30 p-3 text-sm text-foreground" dangerouslySetInnerHTML={{ __html: template.header_html }} />
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-muted-foreground">Body</p>
              <div className="mt-1 space-y-2 rounded border border-border bg-muted/30 p-3 text-sm text-foreground">
                {bodyBlocks.length ? bodyBlocks.map((text, i) => <p key={i}>{text || "(empty)"}</p>) : <p className="text-muted-foreground">—</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">CTA button text</p>
              <p className="text-foreground">{template.cta_text || "—"}</p>
            </div>
            {template.footer_html && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Footer</p>
                <p className="mt-1 text-sm text-foreground">{template.footer_html}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-muted-foreground">Available placeholders</p>
              <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
                {INVITE_PLACEHOLDERS.map((key) => (
                  <code key={key} className="rounded bg-border px-1.5 py-0.5 font-mono text-foreground">
                    {"{{" + key + "}}"}
                  </code>
                ))}
              </p>
            </div>
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
