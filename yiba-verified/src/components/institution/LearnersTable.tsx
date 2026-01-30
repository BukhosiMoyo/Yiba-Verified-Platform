"use client";

import { useRouter, usePathname } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/EmptyState";
import { GraduationCap, Eye } from "lucide-react";
import Link from "next/link";

const ROWS_OPTIONS = [10, 25, 50, 100] as const;

type Learner = {
  learner_id: string;
  national_id: string;
  alternate_id: string | null;
  first_name: string;
  last_name: string;
  birth_date: Date | null;
  created_at: Date;
  user?: { email: string | null } | null;
};

type Props = {
  learners: Learner[];
  total: number;
  page: number;
  limit: number;
  q: string;
  sort: string;
};

export function LearnersTable({ learners, total, page, limit, q, sort }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const buildUrl = (updates: { page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    params.set("page", String(updates.page ?? page));
    params.set("limit", String(updates.limit ?? limit));
    if (q) params.set("q", q);
    params.set("sort", sort);
    return `${pathname}?${params.toString()}`;
  };

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (learners.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16">
        <EmptyState
          title="No learners found"
          description={q ? `No learners match "${q}". Try different search terms.` : "Learners will appear here when they are added."}
          icon={<GraduationCap className="h-6 w-6" strokeWidth={1.5} />}
          variant={q ? "no-results" : "default"}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card shadow-sm dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="border-collapse [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border hover:bg-muted/50">
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground w-12 text-center py-2.5 px-4">#</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground min-w-[160px] py-2.5 px-4">Name</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground min-w-[140px] max-w-[200px] py-2.5 px-4">ID / Alternate</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground w-[90px] py-2.5 px-4">Status</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap py-2.5 px-4 w-[110px]">Birth date</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap py-2.5 px-4 w-[110px]">Added</TableHead>
                  <TableHead className="sticky right-0 z-10 bg-muted/50 border-l border-border text-[11px] font-medium uppercase tracking-wide text-muted-foreground text-right py-2.5 px-4 w-28 min-w-[7rem]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {learners.map((l, i) => {
                  const name = [l.first_name, l.last_name].filter(Boolean).join(" ") || "—";
                  const email = l.user?.email || null;
                  const idLine = [l.national_id, l.alternate_id].filter(Boolean).join(" / ") || "—";
                  return (
                    <TableRow key={l.learner_id} className="group hover:bg-accent/50 transition-colors">
                      <TableCell className="text-center tabular-nums font-semibold text-muted-foreground py-2.5 px-4 w-12">
                        {(page - 1) * limit + i + 1}
                      </TableCell>
                      <TableCell className="py-2.5 px-4">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-semibold text-foreground truncate">{name}</span>
                          {email && <span className="text-xs text-muted-foreground truncate">{email}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 font-mono text-sm min-w-0 max-w-[200px]">
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <span className="block truncate text-foreground/80">{idLine}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs font-mono break-all">
                            {idLine}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="py-2.5 px-4">
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Active</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-2.5 px-4 whitespace-nowrap">{formatDate(l.birth_date)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground py-2.5 px-4 whitespace-nowrap">{formatDate(l.created_at)}</TableCell>
                      <TableCell className="sticky right-0 z-10 bg-card border-l border-border group-hover:bg-accent/50 py-2.5 px-4 text-right">
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/institution/learners/${l.learner_id}`}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent transition-colors"
                            >
                              <Eye className="h-4 w-4" aria-hidden />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="top">View learner</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer: Rows per page (left), Showing X–Y of Z, Prev/Next */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(limit)}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (ROWS_OPTIONS.includes(n as (typeof ROWS_OPTIONS)[number])) {
                  router.replace(buildUrl({ limit: n, page: 1 }));
                }
              }}
              className="w-[70px]"
            >
              {ROWS_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Showing {from}–{to} of {total}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.replace(buildUrl({ page: page - 1 }))} disabled={page <= 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.replace(buildUrl({ page: page + 1 }))} disabled={page * limit >= total}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
