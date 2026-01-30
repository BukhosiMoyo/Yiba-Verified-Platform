"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Monitor, Smartphone } from "lucide-react";
import { replacePlaceholders, INVITE_PLACEHOLDERS } from "@/lib/email/templates/placeholders";
import { buildPreviewHtmlFromFields } from "@/lib/email/templates/inviteTemplates";
import { toast } from "sonner";

const SAMPLE_CONTEXT = {
  recipient_name: "Jane",
  institution_name: "Acme College",
  inviter_name: "Dr. Smith",
  role: "Institution Admin",
  invite_link: "https://app.example.com/invite?token=…",
  action_url: "https://app.example.com/invite?token=…",
  expiry_date: "7 February 2026",
};

type BodySection = { type?: string; content?: string };

type TemplateData = {
  id: string;
  type: string;
  name: string;
  subject: string;
  header_html: string | null;
  body_sections: unknown;
  cta_text: string | null;
  footer_html: string | null;
  is_active?: boolean;
};

const EMPTY_CREATE_STATE = {
  subject: "",
  headerHtml: "",
  bodySections: [{ type: "paragraph", content: "" }] as BodySection[],
  ctaText: "",
  footerHtml: "",
};

export function EmailTemplateEditModal({
  type,
  onClose,
  onSaved,
  createIfMissing = false,
}: {
  type: string;
  onClose: () => void;
  onSaved: () => void;
  createIfMissing?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [headerHtml, setHeaderHtml] = useState("");
  const [bodySections, setBodySections] = useState<BodySection[]>([]);
  const [ctaText, setCtaText] = useState("");
  const [footerHtml, setFooterHtml] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/email-templates/${encodeURIComponent(type)}`)
      .then(async (res) => {
        const data = await res.json();
        return { res, data };
      })
      .then(({ res, data }) => {
        if (cancelled) return;
        if (data.error) {
          if (createIfMissing && res.status === 404) {
            setSubject(EMPTY_CREATE_STATE.subject);
            setHeaderHtml(EMPTY_CREATE_STATE.headerHtml);
            setBodySections(EMPTY_CREATE_STATE.bodySections);
            setCtaText(EMPTY_CREATE_STATE.ctaText);
            setFooterHtml(EMPTY_CREATE_STATE.footerHtml);
            setIsActive(true);
            setError(null);
          } else {
            setError(data.error);
          }
          return;
        }
        const t = data as TemplateData;
        setSubject(t.subject ?? "");
        setHeaderHtml(t.header_html ?? "");
        const sections = Array.isArray(t.body_sections)
          ? (t.body_sections as BodySection[]).map((s) => ({
              type: s.type ?? "paragraph",
              content: typeof s.content === "string" ? s.content : "",
            }))
          : [{ type: "paragraph", content: "" }];
        if (sections.length === 0) sections.push({ type: "paragraph", content: "" });
        setBodySections(sections);
        setCtaText(t.cta_text ?? "");
        setFooterHtml(t.footer_html ?? "");
        setIsActive(t.is_active ?? true);
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
  }, [type, createIfMissing]);

  const handleSave = async () => {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/email-templates/${encodeURIComponent(type)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          header_html: headerHtml.trim() || null,
          body_sections: bodySections.map((s) => ({ type: s.type || "paragraph", content: (s.content ?? "").trim() })),
          cta_text: ctaText.trim() || null,
          footer_html: footerHtml.trim() || null,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success("Template saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const previewSubject = replacePlaceholders(subject, SAMPLE_CONTEXT);
  const previewBody = bodySections
    .map((s) => replacePlaceholders(s.content ?? "", SAMPLE_CONTEXT))
    .filter(Boolean)
    .join("\n\n");
  const previewCta = replacePlaceholders(ctaText || "Review invitation", SAMPLE_CONTEXT);
  const previewFooter = replacePlaceholders(footerHtml, SAMPLE_CONTEXT);

  const livePreviewHtml = useMemo(
    () =>
      buildPreviewHtmlFromFields(
        subject,
        headerHtml,
        bodySections,
        ctaText || "Review invitation",
        footerHtml,
        SAMPLE_CONTEXT,
        "#"
      ),
    [subject, headerHtml, bodySections, ctaText, footerHtml]
  );

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit email template</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update subject, body, and design. Use placeholders in the text — they are replaced when the email is sent.
          </DialogDescription>
          <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span>Available placeholders:</span>
            {INVITE_PLACEHOLDERS.map((key) => (
              <code key={key} className="rounded bg-border px-1 font-mono text-foreground">
                {"{{" + key + "}}"}
              </code>
            ))}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-2">
            <div className="space-y-4 min-w-0">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-foreground">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="You're invited to {{institution_name}}"
                  className="border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="header" className="text-foreground">Header (optional HTML)</Label>
                <textarea
                  id="header"
                  value={headerHtml}
                  onChange={(e) => setHeaderHtml(e.target.value)}
                  rows={2}
                  className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  placeholder="Leave empty for default header"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Body sections</Label>
                {bodySections.map((section, i) => (
                  <div key={i} className="space-y-1">
                    <textarea
                      value={section.content ?? ""}
                      onChange={(e) => {
                        const next = [...bodySections];
                        next[i] = { ...next[i], content: e.target.value };
                        setBodySections(next);
                      }}
                      rows={3}
                      className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      placeholder="Paragraph text. Use {{placeholders}}."
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-border"
                  onClick={() => setBodySections([...bodySections, { type: "paragraph", content: "" }])}
                >
                  Add section
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label htmlFor="active" className="text-foreground">Active</Label>
                  <p className="text-xs text-muted-foreground">When disabled, the system uses the default email instead of this template.</p>
                </div>
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta" className="text-foreground">CTA button text</Label>
                <Input
                  id="cta"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Review invitation"
                  className="border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer" className="text-foreground">Footer (optional)</Label>
                <textarea
                  id="footer"
                  value={footerHtml}
                  onChange={(e) => setFooterHtml(e.target.value)}
                  rows={2}
                  className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  placeholder="Support contact, legal text"
                />
              </div>

              <div className="border-t border-border pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? "Hide text preview" : "Show text preview"}
                </Button>
                {showPreview && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                    <p className="font-medium text-foreground">Subject: {previewSubject || "(empty)"}</p>
                    <div className="mt-2 text-muted-foreground whitespace-pre-wrap">{previewBody || "(empty)"}</div>
                    <p className="mt-2">
                      <span className="inline-block rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                        {previewCta}
                      </span>
                    </p>
                    {previewFooter && (
                      <p className="mt-2 text-xs text-muted-foreground">{previewFooter}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 border-l border-border pl-6 hidden lg:block">
              <p className="text-xs font-medium text-muted-foreground mb-2">Live preview (sample data)</p>
              <div className="flex items-center gap-1 mb-2">
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
              <div
                className="rounded border border-border bg-muted/20 overflow-auto"
                style={{
                  maxWidth: previewMode === "mobile" ? 375 : "100%",
                  margin: previewMode === "mobile" ? "0 auto" : undefined,
                  height: "min(65vh, 520px)",
                }}
              >
                <iframe
                  title="Live email preview"
                  srcDoc={livePreviewHtml}
                  className="w-full border-0 bg-white dark:bg-gray-900"
                  style={{
                    height: "min(65vh, 520px)",
                    width: previewMode === "desktop" ? "100%" : 375,
                  }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving} className="border-border">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
