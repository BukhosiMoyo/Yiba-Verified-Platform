"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Plus, Copy, Check, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PROVINCES } from "@/lib/provinces";

const INVITE_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVOKED", label: "Revoked" },
];

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

export default function QCTOInvitesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as string | undefined;
  const inviteRoleOptions = useMemo(
    () =>
      currentUserRole === "QCTO_SUPER_ADMIN"
        ? QCTO_ROLES.filter((r) => r !== "QCTO_SUPER_ADMIN")
        : [...QCTO_ROLES],
    [currentUserRole]
  );
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [forbiddenMessage, setForbiddenMessage] = useState<string>("You don't have permission to manage QCTO invites.");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "all");
  const [total, setTotal] = useState(0);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: "",
    full_name: "",
    role: "QCTO_REVIEWER",
    province: "",
  });
  const [createdInvite, setCreatedInvite] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "all");
  }, [searchParams]);

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setForbidden(false);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      params.set("limit", "50");
      params.set("offset", "0");

      const response = await fetch(`/api/qcto/invites?${params.toString()}`);

      if (response.status === 403) {
        setForbidden(true);
        setInvites([]);
        setTotal(0);
        try {
          const data = await response.json();
          const msg = data?.error ?? data?.message ?? "";
          if (typeof msg === "string" && msg.includes("No QCTO organisation")) {
            setForbiddenMessage("No QCTO organisation is linked. Contact an administrator.");
          } else {
            setForbiddenMessage("You don't have permission to manage QCTO invites.");
          }
        } catch {
          setForbiddenMessage("You don't have permission to manage QCTO invites.");
        }
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to fetch invites");
      }

      const data = await response.json();
      setInvites(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error("Failed to fetch invites:", err);
      setError(err instanceof Error ? err.message : "Failed to load invites");
      setInvites([]);
      setTotal(0);
      toast.error(err instanceof Error ? err.message : "Failed to load invites");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", newStatus);
    }
    router.push(`/qcto/team-invites?${params.toString()}`);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.email.trim() || !createFormData.full_name.trim()) {
      toast.error("Email and full name are required");
      return;
    }

    try {
      setCreateLoading(true);
      const response = await fetch("/api/qcto/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createFormData.email.trim(),
          full_name: createFormData.full_name.trim(),
          role: createFormData.role,
          province: createFormData.province || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to create invite");
      }

      const data = await response.json();
      setCreatedInvite(data);
      toast.success("Invite created successfully");
      await fetchInvites();
    } catch (err: any) {
      console.error("Failed to create invite:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdInvite?.accept_url) return;
    try {
      await navigator.clipboard.writeText(createdInvite.accept_url);
      setCopiedToken(true);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => setCopiedToken(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy link");
    }
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setCreatedInvite(null);
    setCreateFormData({
      email: "",
      full_name: "",
      role: "QCTO_REVIEWER",
      province: "",
    });
    setCopiedToken(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      PENDING: "default",
      ACCEPTED: "secondary",
      EXPIRED: "outline",
      REVOKED: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (forbidden) {
    return (
      <div className="p-4 md:p-8">
        <EmptyState
          title="Access denied"
          description={forbiddenMessage}
          action={{ label: "Back to QCTO", href: "/qcto" }}
        />
      </div>
    );
  }

  if (error && invites.length === 0 && !loading) {
    return (
      <div className="p-4 md:p-8">
        <EmptyState
          title="Error loading invites"
          description={error}
        />
        <div className="flex justify-center mt-4">
          <Button onClick={fetchInvites}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">QCTO Team Invites</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Manage invitations for QCTO team members
          </p>
        </div>
        <Dialog
          open={createModalOpen}
          onOpenChange={(open) => {
            setCreateModalOpen(open);
            if (!open) {
              handleCloseCreateModal();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Invite QCTO Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join the QCTO team. The invite will expire in 7 days.
              </DialogDescription>
            </DialogHeader>
            {!createdInvite ? (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={createFormData.full_name}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, full_name: e.target.value })
                    }
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    id="role"
                    value={
                      inviteRoleOptions.includes(
                        createFormData.role as (typeof QCTO_ROLES)[number]
                      )
                        ? createFormData.role
                        : inviteRoleOptions[0]
                    }
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, role: e.target.value })
                    }
                  >
                    {inviteRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel(role)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province (Optional)</Label>
                  <Select
                    id="province"
                    value={createFormData.province}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, province: e.target.value })
                    }
                  >
                    <option value="">Select a province...</option>
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This will be set as the default province for the invited user
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseCreateModal}
                    disabled={createLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">✅ Invite created successfully!</p>
                    <p className="text-xs text-muted-foreground">
                      Copy the link below to share with the invitee:
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={createdInvite.accept_url || ""}
                      readOnly
                      className="font-mono text-xs flex-1"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      title="Copy link to clipboard"
                      className="shrink-0"
                    >
                      {copiedToken ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handleCopyLink}
                  >
                    {copiedToken ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Invite Link
                      </>
                    )}
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseCreateModal}>
                    Close
                  </Button>
                  <Button onClick={handleCloseCreateModal}>Done</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invites</CardTitle>
              <CardDescription>
                {loading ? "Loading..." : `${total} invite${total !== 1 ? "s" : ""} total`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                {INVITE_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingTable />
          ) : invites.length === 0 ? (
            <>
              <EmptyState
                title="No invites found"
                description={
                  statusFilter !== "all"
                    ? `No invites with status "${statusFilter}"`
                    : "Get started by inviting a team member"
                }
              />
              {statusFilter === "all" && (
                <div className="flex justify-center mt-4">
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Team Member
                  </Button>
                </div>
              )}
            </>
          ) : (
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>{invite.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabel(invite.role)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(invite.status)}</TableCell>
                      <TableCell>
                        {invite.invitedBy
                          ? `${invite.invitedBy.first_name || ""} ${invite.invitedBy.last_name || ""}`.trim() ||
                            invite.invitedBy.email
                          : "—"}
                      </TableCell>
                      <TableCell>{formatDate(invite.created_at)}</TableCell>
                      <TableCell>{formatDate(invite.expires_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
