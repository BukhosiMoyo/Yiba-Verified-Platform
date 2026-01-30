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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type LogEntry = {
  id: string;
  to_email: string;
  status: string;
  sent_at: string | null;
  failure_reason: string | null;
  updated_at: string;
};

export function EmailLogsTableClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/platform-admin/email-logs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load logs");
      setLogs(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load logs");
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter]);

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      const res = await fetch("/api/platform-admin/invites/retry-failed", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to retry");
      toast.success(`${data.count ?? 0} failed invite(s) queued for retry`);
      fetchLogs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to retry");
    } finally {
      setRetrying(false);
    }
  };

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return "—";
    }
  }

  function statusBadge(status: string) {
    if (["SENT", "DELIVERED", "OPENED", "ACCEPTED"].includes(status)) {
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Sent</Badge>;
    }
    if (status === "FAILED") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (status === "RETRYING") {
      return <Badge variant="secondary">Retrying</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Filter</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          >
            <option value="all">All</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetryFailed}
          disabled={retrying}
          className="border-border"
        >
          {retrying ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          Retry failed invites
        </Button>
      </div>
      <ResponsiveTable withCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="max-w-[200px]">Failure reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No email logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatDate(log.sent_at ?? log.updated_at)}
                  </TableCell>
                  <TableCell className="font-medium">{log.to_email}</TableCell>
                  <TableCell>{statusBadge(log.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={log.failure_reason ?? undefined}>
                    {log.failure_reason ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ResponsiveTable>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
