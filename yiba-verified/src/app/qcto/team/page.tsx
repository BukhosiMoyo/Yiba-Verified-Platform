"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, Eye, MoreHorizontal, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";

const QCTO_ROLES = [
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
] as const;

function roleLabel(r: string) {
  return r.replace(/^QCTO_/, "").replace(/_/g, " ");
}

function getRoleVariant(r: string): "default" | "secondary" | "outline" {
  if (r === "QCTO_SUPER_ADMIN" || r === "QCTO_ADMIN") return "default";
  return "secondary";
}

export default function QCTOTeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("QCTO_REVIEWER");
  const [viewModal, setViewModal] = useState<{ name: string; email: string; role: string; status: string; created: string } | null>(null);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      setForbidden(false);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      params.set("limit", "100");
      params.set("offset", "0");
      const res = await fetch(`/api/qcto/team?${params}`);
      if (res.status === 403) {
        setForbidden(true);
        setMembers([]);
        setTotal(0);
        return;
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load team");
      }
      const d = await res.json();
      setMembers(d.items || []);
      setTotal(d.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team");
      setMembers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [searchQuery]);

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
      toast.success("Invite created. " + (data.accept_url ? "Use the link in the response for demo." : ""));
      setInviteOpen(false);
      setInviteFullName("");
      setInviteEmail("");
      setInviteRole("QCTO_REVIEWER");
      if (data.accept_url && typeof window !== "undefined") {
        console.log("[QCTO Invite] Accept URL:", data.accept_url);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const setStatus = async (userId: string, status: "ACTIVE" | "INACTIVE") => {
    try {
      const res = await fetch(`/api/qcto/team/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update");
      }
      toast.success(`User ${status === "ACTIVE" ? "enabled" : "disabled"}`);
      fetchTeam();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const setRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/qcto/team/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update role");
      }
      toast.success("Role updated");
      fetchTeam();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    }
  };

  const formatDate = (s: string) =>
    s ? new Date(s).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "—";

  if (forbidden) {
    return (
      <div className="p-4 md:p-8">
        <EmptyState
          title="Access denied"
          description="You don’t have permission to manage the QCTO team."
          icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
          variant="no-results"
        />
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/qcto")}>
            Back to QCTO
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">QCTO Team</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Manage reviewers, admins, and access levels for QCTO operations.
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Invite staff
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
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
                >
                  {QCTO_ROLES.map((r) => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteSubmitting}>
                  {inviteSubmitting ? "Sending…" : "Send invite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-48 sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name or email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      {loading ? (
        <LoadingTable columns={6} rows={5} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No team members found"
          description={searchQuery ? "Try a different search." : "Invite staff to get started."}
          icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
          variant={searchQuery ? "no-results" : "default"}
        />
      ) : (
        <div className="rounded-xl border border-gray-200/60 overflow-x-auto bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center" style={{ minWidth: 48 }}>#</TableHead>
                <TableHead style={{ minWidth: 200 }}>Name</TableHead>
                <TableHead style={{ minWidth: 140 }}>Role</TableHead>
                <TableHead style={{ minWidth: 100 }}>Status</TableHead>
                <TableHead style={{ minWidth: 110 }}>Last login</TableHead>
                <TableHead className="text-right" style={{ minWidth: 140 }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m, i) => (
                <TableRow key={m.user_id}>
                  <TableCell className="text-center text-muted-foreground text-sm">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700 font-medium text-sm">
                        {((m.first_name || "")[0] || (m.email || "?")[0] || "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="font-medium truncate">{[m.first_name, m.last_name].filter(Boolean).join(" ") || "—"}</p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">{[m.first_name, m.last_name].filter(Boolean).join(" ") || "—"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm text-muted-foreground truncate">{m.email}</p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">{m.email}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleVariant(m.role)}>{roleLabel(m.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.status === "ACTIVE" ? "default" : "secondary"}>
                      {m.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.last_login ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewModal({
                          name: [m.first_name, m.last_name].filter(Boolean).join(" ") || "—",
                          email: m.email,
                          role: roleLabel(m.role),
                          status: m.status === "ACTIVE" ? "Active" : "Inactive",
                          created: formatDate(m.created_at),
                        })}
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setStatus(m.user_id, m.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                        aria-label={m.status === "ACTIVE" ? "Disable" : "Enable"}
                      >
                        {m.status === "ACTIVE" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Change role">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {QCTO_ROLES.map((r) => (
                            <DropdownMenuItem
                              key={r}
                              onClick={() => setRole(m.user_id, r)}
                            >
                              {roleLabel(r)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {viewModal && (
        <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Team member</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {viewModal.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {viewModal.email}</p>
              <p><span className="text-muted-foreground">Role:</span> {viewModal.role}</p>
              <p><span className="text-muted-foreground">Status:</span> {viewModal.status}</p>
              <p><span className="text-muted-foreground">Joined:</span> {viewModal.created}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
