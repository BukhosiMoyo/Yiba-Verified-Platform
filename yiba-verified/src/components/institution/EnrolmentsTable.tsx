"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/EmptyState";
import { GraduationCap, Eye } from "lucide-react";
import Link from "next/link";

type Enrolment = {
  enrolment_id: string;
  qualification_title: string | null;
  start_date: Date | null;
  expected_completion_date: Date | null;
  enrolment_status: string;
  learner: {
    national_id: string;
    first_name: string;
    last_name: string;
  };
  qualification: {
    name: string;
    code: string | null;
  } | null;
};

type Props = {
  enrolments: Enrolment[];
  searchQuery: string;
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "Active",
    COMPLETED: "Completed",
    TRANSFERRED: "Transferred",
    ARCHIVED: "Archived",
  };
  return map[status] || status;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800">
        {formatStatus(status)}
      </Badge>
    );
  }
  const variant =
    status === "ACTIVE" ? "success" : status === "TRANSFERRED" ? "warning" : "outline";
  return <Badge variant={variant}>{formatStatus(status)}</Badge>;
}

export function EnrolmentsTable({ enrolments, searchQuery }: Props) {
  if (enrolments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/30 py-16">
        <EmptyState
          title="No enrolments found"
          description={
            searchQuery
              ? `No enrolments match "${searchQuery}". Try a different search term.`
              : "Create an enrolment to link a learner to a qualification. Enrolments track the progress and status of learners in their qualifications."
          }
          icon={<GraduationCap className="h-6 w-6" strokeWidth={1.5} />}
          variant={searchQuery ? "no-results" : "default"}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-gray-200/60 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 dark:[&_th]:border-border [&_td]:border [&_td]:border-gray-200 dark:[&_td]:border-border">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-muted/50 border-b border-gray-200 dark:border-border hover:bg-gray-50/80 dark:hover:bg-muted/50">
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground w-12 text-center py-2.5 px-4">
                  #
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground min-w-[140px] py-2.5 px-4">
                  Learner
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground min-w-[120px] max-w-[180px] py-2.5 px-4">
                  National ID
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground min-w-[180px] py-2.5 px-4">
                  Qualification
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap py-2.5 px-4 w-[110px]">
                  Start
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap py-2.5 px-4 w-[120px]">
                  Expected end
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground py-2.5 px-4 w-[100px]">
                  Status
                </TableHead>
                <TableHead className="sticky right-0 z-10 bg-gray-50/80 dark:bg-muted/50 border-l border-gray-200 dark:border-border text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground text-right py-2.5 px-4 w-28 min-w-[7rem]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolments.map((e, i) => {
                const learnerName = [e.learner.first_name, e.learner.last_name].filter(Boolean).join(" ") || "—";
                const qualDisplay = e.qualification?.name || e.qualification_title || "—";
                const qualSub = e.qualification?.code ? ` (${e.qualification.code})` : "";
                const qualFull = qualDisplay + qualSub;
                return (
                  <TableRow
                    key={e.enrolment_id}
                    className="group hover:bg-violet-50/40 dark:hover:bg-violet-950/20 transition-colors"
                  >
                    <TableCell className="text-center tabular-nums font-semibold text-gray-700 dark:text-muted-foreground py-2.5 px-4 w-12">
                      {i + 1}
                    </TableCell>
                    <TableCell className="py-2.5 px-4">
                      <span className="font-semibold text-gray-900 dark:text-foreground truncate block">
                        {learnerName}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 font-mono text-sm min-w-0 max-w-[180px]">
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <span className="block truncate text-gray-700 dark:text-muted-foreground">
                            {e.learner.national_id}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-mono break-all">
                          {e.learner.national_id}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 min-w-0 max-w-[240px]">
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <span className="block truncate text-gray-700 dark:text-foreground">
                            {qualFull}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm text-xs">
                          {qualFull}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-muted-foreground py-2.5 px-4 whitespace-nowrap">
                      {formatDate(e.start_date)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-muted-foreground py-2.5 px-4 whitespace-nowrap">
                      {formatDate(e.expected_completion_date)}
                    </TableCell>
                    <TableCell className="py-2.5 px-4">
                      <StatusBadge status={e.enrolment_status} />
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 bg-white dark:bg-card border-l border-gray-200 dark:border-border group-hover:bg-violet-50/40 dark:group-hover:bg-violet-950/20 py-2.5 px-4 text-right">
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/institution/enrolments/${e.enrolment_id}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 dark:border-border bg-white dark:bg-background text-gray-700 dark:text-foreground hover:bg-violet-50 hover:border-violet-200/80 dark:hover:border-violet-800/50 transition-colors"
                          >
                            <Eye className="h-4 w-4" aria-hidden />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          View enrolment
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
