"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Pencil } from "lucide-react";
import { PlaceholdersReference } from "./PlaceholdersReference";
import { EmailTemplateEditModal } from "./EmailTemplateEditModal";
import { replacePlaceholders } from "@/lib/email/templates/placeholders";

type TemplateItem = {
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

const SAMPLE_CONTEXT = {
  recipient_name: "Jane",
  institution_name: "Acme College",
  inviter_name: "Dr. Smith",
  role: "Institution Admin",
  invite_link: "https://app.example.com/invite?token=…",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function EmailTemplatesSection() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/email-templates");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load templates");
      setTemplates(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSaved = () => {
    setEditingType(null);
    fetchTemplates();
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
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {templates.length === 0 ? (
            <Card className="border-border p-6 text-center text-muted-foreground">
              <Mail className="mx-auto h-10 w-10 opacity-50" />
              <p className="mt-2">No templates available.</p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {templates.map((t) => (
                <li key={t.id}>
                  <Card className="border-border bg-card p-4 transition-colors hover:bg-muted/30">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{t.name}</p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {replacePlaceholders(t.subject, SAMPLE_CONTEXT)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Updated {formatDate(t.updated_at)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setEditingType(t.type)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="lg:order-first">
          <PlaceholdersReference />
        </div>
      </div>

      {editingType && (
        <EmailTemplateEditModal
          type={editingType}
          onClose={() => setEditingType(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
