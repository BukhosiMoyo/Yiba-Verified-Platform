"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import {
  TRIGGER_EVENT_BY_TYPE,
  CATEGORY_BY_TYPE,
  USED_BY_BY_TYPE,
  ALL_TEMPLATE_TYPES,
} from "@/lib/email/templates/metadata";
import type { EmailTemplateType } from "@prisma/client";
import { Mail, Loader2, Eye, Pencil, Smartphone } from "lucide-react";
import { EmailTemplateEditModal } from "@/components/settings/EmailTemplateEditModal";
import { EmailTemplateViewModal } from "./EmailTemplateViewModal";
import { EmailTemplatePreviewModal } from "./EmailTemplatePreviewModal";

type TemplateRow = {
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

export function EmailTemplatesTableClient() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editType, setEditType] = useState<string | null>(null);
  const [viewType, setViewType] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);

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
    setEditType(null);
    fetchTemplates();
  };

  const byType = new Map<string, TemplateRow>(templates.map((t) => [t.type, t]));

  // Build rows for all types; use existing template or placeholder
  const rows = ALL_TEMPLATE_TYPES.map((type) => {
    const template = byType.get(type);
    const name = template?.name ?? (type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    const triggerEvent = TRIGGER_EVENT_BY_TYPE[type];
    const category = CATEGORY_BY_TYPE[type];
    const usedBy = USED_BY_BY_TYPE[type];
    const exists = !!template;
    return {
      type,
      name,
      triggerEvent,
      category,
      usedBy,
      exists,
      template: template ?? null,
    };
  });

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
      <ResponsiveTable withCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Trigger event</TableHead>
              <TableHead>Used by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.type}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {row.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate" title={row.triggerEvent}>
                  {row.triggerEvent}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate" title={row.usedBy}>
                  {row.usedBy}
                </TableCell>
                <TableCell>
                  {row.exists ? (
                    row.template?.is_active ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )
                  ) : (
                    <span className="text-muted-foreground text-sm">Not created yet</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {row.exists && row.template?.updated_at
                    ? formatDate(row.template.updated_at)
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {row.exists && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewType(row.type)}
                          aria-label="View template"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewType(row.type)}
                          aria-label="Preview email"
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditType(row.type)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      {row.exists ? "Edit" : "Create"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTable>

      {editType && (
        <EmailTemplateEditModal
          type={editType}
          onClose={() => setEditType(null)}
          onSaved={handleSaved}
          createIfMissing
        />
      )}
      {viewType && (
        <EmailTemplateViewModal
          type={viewType}
          usedBy={USED_BY_BY_TYPE[viewType as EmailTemplateType]}
          triggerEvent={TRIGGER_EVENT_BY_TYPE[viewType as EmailTemplateType]}
          onClose={() => setViewType(null)}
        />
      )}
      {previewType && (
        <EmailTemplatePreviewModal
          type={previewType}
          onClose={() => setPreviewType(null)}
        />
      )}
    </div>
  );
}
