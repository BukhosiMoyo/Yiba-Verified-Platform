"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Eye } from "lucide-react";
import type { Role } from "@/lib/rbac";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";

type ViewMode = "list" | "grid";

type FlagDoc = {
  document_id: string;
  file_name: string;
  document_type: string;
  mime_type: string | null;
};
type FlagRow = {
  flag_id: string;
  reason: string;
  status: string;
  created_at: Date;
  resolved_at: Date | null;
  flaggedByUser: { first_name: string | null; last_name: string | null; email: string };
  resolvedByUser: { first_name: string | null; last_name: string | null } | null;
  document: FlagDoc & {
    institution: { legal_name: string; trading_name: string } | null;
    enrolment: { institution: { legal_name: string; trading_name: string } } | null;
    learner: { institution: { legal_name: string; trading_name: string } } | null;
    readiness: { institution: { legal_name: string; trading_name: string } } | null;
  };
};

function isPdf(doc: FlagDoc): boolean {
  if (doc.mime_type === "application/pdf") return true;
  return /\.pdf$/i.test(doc.file_name);
}

function getInstitutionName(f: FlagRow): string {
  return (
    f.document.institution?.trading_name ||
    f.document.institution?.legal_name ||
    f.document.enrolment?.institution?.trading_name ||
    f.document.enrolment?.institution?.legal_name ||
    f.document.learner?.institution?.trading_name ||
    f.document.learner?.institution?.legal_name ||
    f.document.readiness?.institution?.trading_name ||
    f.document.readiness?.institution?.legal_name ||
    "—"
  );
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function flaggedBy(f: FlagRow): string {
  return [f.flaggedByUser.first_name, f.flaggedByUser.last_name].filter(Boolean).join(" ") || f.flaggedByUser.email || "—";
}

function resolvedBy(f: FlagRow): string {
  if (!f.resolvedByUser) return "—";
  return [f.resolvedByUser.first_name, f.resolvedByUser.last_name].filter(Boolean).join(" ") || "—";
}

interface EvidenceFlagsDisplayProps {
  view: ViewMode;
  flags: FlagRow[];
  userRole: Role;
  /** Row offset for # column (e.g. from pagination). Default 0. */
  offset?: number;
}

export function EvidenceFlagsDisplay({ view, flags, userRole, offset = 0 }: EvidenceFlagsDisplayProps) {
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const isPlatformAdmin = userRole === "PLATFORM_ADMIN";

  const quickViewUrl =
    quickViewId ? `/api/institutions/documents/${quickViewId}/download?inline=1` : "";

  const btnClass = "h-6 min-w-0 px-1.5 text-[11px] gap-1 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-400";

  return (
    <>
      {view === "list" ? (
        <ResponsiveTable>
          <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 [&_td]:border [&_td]:border-gray-200">
            <TableHeader>
              <TableRow className="bg-gray-50/40 hover:bg-gray-50/40">
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap w-12">#</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Document</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Institution</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Reason</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Status</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Flagged by</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Created</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Resolved</TableHead>
                <TableHead className="sticky right-0 z-10 bg-gray-50 border-l border-gray-200 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map((f, index) => (
                <TableRow key={f.flag_id} className="group hover:bg-sky-50/50 transition-colors duration-200">
                  <TableCell className="py-3 whitespace-nowrap text-gray-800 w-12 font-bold">{offset + index + 1}</TableCell>
                  <TableCell className="font-medium py-3">
                    {f.document.file_name}
                    <span className="text-muted-foreground ml-1 text-xs">({f.document.document_type})</span>
                  </TableCell>
                  <TableCell className="py-3 whitespace-nowrap">{getInstitutionName(f)}</TableCell>
                  <TableCell className="py-3 max-w-[200px] truncate" title={f.reason}>{f.reason}</TableCell>
                  <TableCell className="py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        f.status === "ACTIVE" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {f.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 whitespace-nowrap">{flaggedBy(f)}</TableCell>
                  <TableCell className="py-3 whitespace-nowrap text-muted-foreground text-sm">{formatDate(f.created_at)}</TableCell>
                  <TableCell className="py-3 whitespace-nowrap text-muted-foreground text-sm">
                    {f.resolved_at ? formatDate(f.resolved_at) : "—"}
                    {f.resolvedByUser && <span className="block text-xs">by {resolvedBy(f)}</span>}
                  </TableCell>
                  <TableCell className="sticky right-0 z-10 bg-white group-hover:bg-sky-50/50 border-l border-gray-200 py-3 whitespace-nowrap">
                    <div className="flex flex-wrap items-center gap-1">
                      {isPdf(f.document) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={btnClass}
                          onClick={() => setQuickViewId(f.document.document_id)}
                        >
                          <Eye className="h-3 w-3" aria-hidden />
                          Quick view
                        </Button>
                      )}
                      {isPlatformAdmin && (
                        <Button variant="outline" size="sm" asChild className={btnClass}>
                          <Link href={`/institution/documents/${f.document.document_id}`}>
                            <FileText className="h-3 w-3" aria-hidden />
                            View document
                          </Link>
                        </Button>
                      )}
                      {!isPdf(f.document) && !isPlatformAdmin && <span className="text-muted-foreground text-xs">—</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTable>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flags.map((f) => (
            <Card key={f.flag_id} className="overflow-hidden border border-gray-200/70">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-50/80 p-2 text-amber-700">
                    <FileText className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{f.document.file_name}</p>
                    <p className="text-muted-foreground text-xs">{f.document.document_type}</p>
                    <p className="mt-1 text-muted-foreground text-sm">{getInstitutionName(f)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-700" title={f.reason}>
                      {f.reason}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          f.status === "ACTIVE" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {f.status}
                      </span>
                      <span className="text-muted-foreground text-xs">{formatDate(f.created_at)}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">Flagged by {flaggedBy(f)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isPdf(f.document) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => setQuickViewId(f.document.document_id)}
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Quick view
                        </Button>
                      )}
                      {isPlatformAdmin && (
                        <Button variant="outline" size="sm" className="h-8" asChild>
                          <Link href={`/institution/documents/${f.document.document_id}`}>
                            View document
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!quickViewId} onOpenChange={(o) => !o && setQuickViewId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document preview</DialogTitle>
          </DialogHeader>
          <div className="min-h-[60vh] w-full overflow-hidden rounded-lg border border-gray-200/80 bg-gray-50/50">
            {quickViewUrl ? (
              <iframe
                src={quickViewUrl}
                title="Document preview"
                className="h-[70vh] w-full border-0"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
