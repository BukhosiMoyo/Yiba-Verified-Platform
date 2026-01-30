"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Select } from "@/components/ui/select";
import { Search, Plus, Eye, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE_KEY = "yv_table_page_size:qcto_team";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const PREFETCH_VIEW_ROWS = 20;

const QCTO_ROLES = [
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
] as const;

type MemberRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  role: string;
  status: string;
  created_at: Date | string;
  image: string | null;
  last_login: string | null;
};

export interface QctoTeamClientProps {
  members: MemberRow[];
  total: number;
  initialQ: string;
  limit: number;
  offset: number;
}

function roleLabel(r: string) {
  return r.replace(/^QCTO_/, "").replace(/_/g, " ");
}

function getRoleVariant(r: string): "default" | "secondary" | "outline" {
  if (r === "QCTO_SUPER_ADMIN" || r === "QCTO_ADMIN") return "default";
  return "secondary";
}

function formatDate(s: string | Date) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function QctoTeamClient({
  members,
  total,
  initialQ,
  limit,
  offset,
}: QctoTeamClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("QCTO_REVIEWER");

  useEffect(() => {
    setSearchQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (ROWS_PER_PAGE_OPTIONS.includes(n as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
          // Page size from localStorage; URL takes precedence via props
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const prefetchView = (path: string) => () => {
    if (path?.startsWith("/")) router.prefetch(path);
  };

  useEffect(() => {
    const toPrefetch = members
      .slice(0, PREFETCH_VIEW_ROWS)
      .map((m) => `/qcto/team/${m.user_id}`);
    toPrefetch.forEach((path) => router.prefetch(path));
  }, [router, members]);

  const buildParams = (updates: { q?: string; limit?: number; offset?: number }) => {
    const p = new URLSearchParams(searchParams.toString());
    const qq = updates.q !== undefined ? updates.q : initialQ;
    const lim = updates.limit ?? limit;
    const off = updates.offset ?? offset;
    if (qq) p.set("q", qq);
    else p.delete("q");
    p.set("limit", String(lim));
    p.set("offset", String(off));
    return p.toString();
  };

  const handleSearch = (v: string) => {
    setSearchQuery(v);
    router.push(`?${buildParams({ q: v, offset: 0 })}`, { scroll: false });
  };

  const handlePageSizeChange = (size: number) => {
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch {
      /* ignore */
    }
    router.push(`?${buildParams({ limit: size, offset: 0 })}`, { scroll: false });
  };

  const goPrev = () => {
    const nextOffset = Math.max(0, offset - limit);
    router.push(`?${buildParams({ offset: nextOffset })}`, { scroll: false });
  };

  const goNext = () => {
    if (offset + limit >= total) return;
    router.push(`?${buildParams({ offset: offset + limit })}`, { scroll: false });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFullName.trim() || !inviteEmail.trim()) {
      toast.error("Full name and email are required");
      return;
    }
    setInviteSubmitting(true);
    try {
      const res = await fetch("/api/qcto/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: inviteFullName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      toast.success("Invite created.");
      setInviteOpen(false);
      setInviteFullName("");
      setInviteEmail("");
      setInviteRole("QCTO_REVIEWER");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search team..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Invite staff
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Invite staff</DialogTitle>
              <DialogDescription>
                Send an invite to join the QCTO team. They will receive a link to accept.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name *</Label>
                <Input
                  id="full_name"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite_email">Email *</Label>
                <Input
                  id="invite_email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite_role">Role</Label>
                <Select
                  id="invite_role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full"
                >
                  {QCTO_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteSubmitting}>
                  {inviteSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send invite
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <EmptyState
          title={initialQ ? "No team members found" : "No team members yet"}
          description={
            initialQ
              ? "No one matches your search. Try a different query."
              : "Invite staff to get started."
          }
          icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
          variant={initialQ ? "no-results" : "default"}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Name</TableHead>
                  <TableHead className="min-w-[180px]">Email</TableHead>
                  <TableHead className="min-w-[120px]">Role</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[110px]">Joined</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
                  const createdStr = formatDate(m.created_at);
                  return (
                    <TableRow key={m.user_id}>
                      <TableCell className="font-medium">
                        <TooltipProvider>
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <span className="block truncate max-w-[200px]">{name}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-md">
                              {name}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <span className="block truncate max-w-[200px]">
                                {m.email ?? "—"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-md">
                              {m.email ?? "—"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleVariant(m.role)}>{roleLabel(m.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.status ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {createdStr}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.user_id ? (
                          <Link
                            href={`/qcto/team/${m.user_id}`}
                            onMouseEnter={prefetchView(`/qcto/team/${m.user_id}`)}
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={String(limit)}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                className="w-[70px]"
              >
                {ROWS_PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={goPrev} disabled={offset === 0}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goNext}
                  disabled={offset + limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
