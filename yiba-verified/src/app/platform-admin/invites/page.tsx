"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Plus,
  Copy,
  Check,
  Loader2,
  X,
  RefreshCw,
  Upload,
  BarChart3,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BulkInviteDrawer } from "@/components/invites/BulkInviteDrawer";

const INVITE_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "QUEUED", label: "Queued" },
  { value: "SENDING", label: "Sending" },
  { value: "SENT", label: "Sent" },
  { value: "OPENED", label: "Opened" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "FAILED", label: "Failed" },
  { value: "RETRYING", label: "Retrying" },
  { value: "EXPIRED", label: "Expired" },
];

export default function InvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Create invite modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: "",
    role: "",
    institution_id: "",
  });
  const [createdInvite, setCreatedInvite] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Fetch institutions for dropdown
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setLoadingInstitutions(true);
        const response = await fetch("/api/dev/institutions?limit=100");
        if (response.ok) {
          const data = await response.json();
          setInstitutions(data.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch institutions:", err);
      } finally {
        setLoadingInstitutions(false);
      }
    };
    fetchInstitutions();
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [statusFilter, offset]);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());

      const response = await fetch(`/api/platform-admin/invites?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch invites");
      }

      const data = await response.json();
      setInvites(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setInvites([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: createFormData.email.trim(),
          role: createFormData.role,
          institution_id: createFormData.institution_id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create invite");
      }

      const data = await response.json();
      setCreatedInvite(data);
      toast.success("Invite created successfully");
      fetchInvites();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResend = async (inviteId: string) => {
    try {
      setResendingId(inviteId);
      const response = await fetch(`/api/platform-admin/invites/${inviteId}/resend`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to resend invite");
      }

      toast.success("Invite queued for resending");
      fetchInvites();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend invite");
    } finally {
      setResendingId(null);
    }
  };

  const copyInviteLink = async () => {
    if (createdInvite?.invite_link) {
      await navigator.clipboard.writeText(createdInvite.invite_link);
      setCopiedToken(true);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => {
        setCopiedToken(false);
        setCreateModalOpen(false);
        setCreatedInvite(null);
        setCreateFormData({ email: "", role: "", institution_id: "" });
      }, 2000);
    }
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      QUEUED: { label: "Queued", variant: "outline" },
      SENDING: { label: "Sending", variant: "outline" },
      SENT: { label: "Sent", variant: "secondary" },
      DELIVERED: { label: "Delivered", variant: "secondary" },
      OPENED: { label: "Opened", variant: "default" },
      ACCEPTED: { label: "Accepted", variant: "default" },
      FAILED: { label: "Failed", variant: "destructive" },
      RETRYING: { label: "Retrying", variant: "outline" },
      EXPIRED: { label: "Expired", variant: "secondary" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return "default";
      case "INSTITUTION_ADMIN":
        return "default";
      case "INSTITUTION_STAFF":
        return "secondary";
      case "QCTO_USER":
        return "default";
      case "STUDENT":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invites</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage user invitations and track delivery
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/platform-admin/invites/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setBulkDrawerOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Invite
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Invite
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Invites</CardTitle>
              <CardDescription>
                {loading ? "Loading..." : `${total} invite${total !== 1 ? "s" : ""} found`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setOffset(0);
                }}
                className="w-48"
              >
                {INVITE_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInvites}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingTable />
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : invites.length === 0 ? (
            <EmptyState
              title="No invites found"
              description={
                statusFilter !== "all"
                  ? "Try adjusting your filter"
                  : "Create your first invite to get started"
              }
              icon={<Mail className="h-12 w-12 text-gray-400" />}
            />
          ) : (
            <>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => {
                      const lastActivity =
                        invite.accepted_at ||
                        invite.clicked_at ||
                        invite.opened_at ||
                        invite.sent_at ||
                        invite.last_attempt_at ||
                        invite.created_at;

                      return (
                        <TableRow key={invite.invite_id}>
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(invite.role)}>
                              {invite.role.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invite.institution
                              ? invite.institution.trading_name || invite.institution.legal_name
                              : "—"}
                          </TableCell>
                          <TableCell>{getStatusBadge(invite.status || "QUEUED")}</TableCell>
                          <TableCell className="text-sm">
                            {invite.attempts || 0}
                            {invite.max_attempts && ` / ${invite.max_attempts}`}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(lastActivity)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(invite.expires_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {(invite.status === "FAILED" || invite.status === "RETRYING") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResend(invite.invite_id)}
                                  disabled={resendingId === invite.invite_id}
                                >
                                  {resendingId === invite.invite_id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              {invite.failure_reason && (
                                <span
                                  className="text-xs text-red-600 cursor-help"
                                  title={invite.failure_reason}
                                >
                                  ⚠️
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ResponsiveTable>

              {/* Pagination */}
              {!loading && invites.length > 0 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Invite Drawer */}
      <BulkInviteDrawer
        open={bulkDrawerOpen}
        onOpenChange={setBulkDrawerOpen}
        onSuccess={() => {
          fetchInvites();
          setBulkDrawerOpen(false);
        }}
        institutions={institutions}
      />

      {/* Create Invite Modal */}
      <Dialog
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) {
            setCreatedInvite(null);
            setCreateFormData({ email: "", role: "", institution_id: "" });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          {createdInvite ? (
            <>
              <DialogHeader>
                <DialogTitle>Invite Created</DialogTitle>
                <DialogDescription>
                  Copy the invite link and share it with the user
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 font-medium">{createdInvite.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Role</p>
                    <p className="text-sm text-gray-900">
                      {createdInvite.role.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Invite Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={createdInvite.invite_link}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={copyInviteLink}
                      disabled={copiedToken}
                    >
                      {copiedToken ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    This link expires in 7 days. The invite will be sent via email automatically.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setCreatedInvite(null);
                    setCreateFormData({ email: "", role: "", institution_id: "" });
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleCreateInvite}>
              <DialogHeader>
                <DialogTitle>Create New Invite</DialogTitle>
                <DialogDescription>
                  Send an invitation to join Yiba Verified
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, email: e.target.value })
                    }
                    required
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    id="role"
                    value={createFormData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setCreateFormData({
                        ...createFormData,
                        role: newRole,
                        institution_id: "",
                      });
                    }}
                    required
                  >
                    <option value="">Select role</option>
                    <option value="PLATFORM_ADMIN">Platform Admin</option>
                    <option value="QCTO_USER">QCTO User</option>
                    <option value="INSTITUTION_ADMIN">Institution Admin</option>
                    <option value="INSTITUTION_STAFF">Institution Staff</option>
                    <option value="STUDENT">Student</option>
                  </Select>
                </div>
                {(createFormData.role === "INSTITUTION_ADMIN" ||
                  createFormData.role === "INSTITUTION_STAFF" ||
                  createFormData.role === "STUDENT") && (
                  <div className="space-y-2">
                    <Label htmlFor="institution_id">Institution *</Label>
                    <Select
                      id="institution_id"
                      value={createFormData.institution_id}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, institution_id: e.target.value })
                      }
                      required
                      disabled={loadingInstitutions}
                    >
                      <option value="">Select institution</option>
                      {institutions.map((inst) => (
                        <option key={inst.institution_id} value={inst.institution_id}>
                          {inst.trading_name || inst.legal_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Invite
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
