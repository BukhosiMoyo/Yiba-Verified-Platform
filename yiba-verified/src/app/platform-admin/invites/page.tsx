"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
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
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BulkInviteDrawer } from "@/components/invites/BulkInviteDrawer";
import { InstitutionSearch } from "@/components/shared/InstitutionSearch";
import { PROVINCES } from "@/lib/provinces";

const INVITE_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "QUEUED", label: "Queued" },
  { value: "SENDING", label: "Sending" },
  { value: "SENT", label: "Sent" },
  { value: "OPENED", label: "Opened" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
  { value: "FAILED", label: "Failed" },
  { value: "RETRYING", label: "Retrying" },
  { value: "EXPIRED", label: "Expired" },
];

export default function InvitesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invites, setInvites] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "all");
  const [institutionFilter, setInstitutionFilter] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [total, setTotal] = useState(0);

  // Sync status filter from URL when navigating via sidebar links
  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "all");
  }, [searchParams]);
  
  const PAGE_SIZE_KEY = "yv_table_page_size:platform_admin_invites";
  const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
  const [pageSize, setPageSize] = useState(20);
  const [offset, setOffset] = useState(0);
  
  // Load saved page size from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (ROWS_PER_PAGE_OPTIONS.includes(n as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
          setPageSize(n);
        }
      }
    } catch (_) { /* ignore */ }
  }, []);
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setOffset(0);
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch (_) { /* ignore */ }
  };
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Create invite modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: "",
    role: "",
    institution_id: "",
    default_province: "",
  });
  const [createdInvite, setCreatedInvite] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);

  // Fetch institutions for dropdown
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setLoadingInstitutions(true);
        const response = await fetch("/api/platform-admin/institutions?limit=100");
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
  }, [statusFilter, institutionFilter, emailSearch, offset, pageSize]);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (institutionFilter) {
        params.set("institution_id", institutionFilter);
      }
      if (emailSearch.trim()) {
        params.set("q", emailSearch.trim());
      }
      params.set("limit", pageSize.toString());
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
    
    // Validate based on role
    // Institution required only for INSTITUTION_STAFF and STUDENT; INSTITUTION_ADMIN may add institution(s) during onboarding
    const institutionRequired =
      createFormData.role === "INSTITUTION_STAFF" || createFormData.role === "STUDENT";
    const needsProvince =
      createFormData.role === "QCTO_ADMIN" ||
      createFormData.role === "QCTO_USER" ||
      createFormData.role === "QCTO_REVIEWER" ||
      createFormData.role === "QCTO_AUDITOR" ||
      createFormData.role === "QCTO_VIEWER";
    
    if (institutionRequired && !createFormData.institution_id) {
      toast.error("Institution is required for Institution Staff and Student");
      return;
    }
    if (needsProvince && !createFormData.default_province) {
      toast.error("Province is required for this role");
      return;
    }
    
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
          default_province: createFormData.default_province || null,
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
  
  // Determine which fields to show based on role
  const getRoleFields = () => {
    const role = createFormData.role;
    const simpleRoles = ["PLATFORM_ADMIN", "QCTO_SUPER_ADMIN", "ADVISOR"];
    const qctoRolesWithProvince = ["QCTO_ADMIN", "QCTO_USER", "QCTO_REVIEWER", "QCTO_AUDITOR", "QCTO_VIEWER"];
    const institutionRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "STUDENT"];
    // Institution required only for STAFF and STUDENT; optional for INSTITUTION_ADMIN (they add during onboarding)
    const institutionRequired = role === "INSTITUTION_STAFF" || role === "STUDENT";
    
    return {
      isSimple: simpleRoles.includes(role),
      needsProvince: qctoRolesWithProvince.includes(role),
      needsInstitution: institutionRoles.includes(role),
      institutionRequired,
      showAdminInfo: role === "INSTITUTION_ADMIN",
    };
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
        setCreateFormData({ email: "", role: "", institution_id: "", default_province: "" });
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
      DECLINED: { label: "Declined", variant: "secondary" },
      FAILED: { label: "Failed", variant: "destructive" },
      RETRYING: { label: "Retrying", variant: "outline" },
      EXPIRED: { label: "Expired", variant: "secondary" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDeclineReasonLabel = (reason: string | null | undefined, other: string | null | undefined) => {
    if (!reason) return "—";
    const labels: Record<string, string> = {
      already_using_other_platform: "Already using another platform",
      not_responsible: "Not responsible for this institution",
      not_interested: "Not interested",
      other: other || "Other",
    };
    return labels[reason] ?? reason;
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
          <h1 className="text-2xl font-semibold text-foreground">Invites</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Invites</CardTitle>
                <CardDescription>
                  {loading ? "Loading..." : `${total} invite${total !== 1 ? "s" : ""} found`}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInvites}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Email Search */}
              <div className="relative w-48 sm:w-64">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={emailSearch}
                  onChange={(e) => {
                    setEmailSearch(e.target.value);
                    setOffset(0);
                  }}
                  className="pl-10"
                />
              </div>
              
              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setOffset(0);
                }}
                className="w-40"
              >
                {INVITE_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
              
              {/* Institution Filter */}
              <SearchableSelect
                value={institutionFilter}
                onChange={(value) => {
                  setInstitutionFilter(value);
                  setOffset(0);
                }}
                options={institutions.map((inst) => ({
                  value: inst.institution_id,
                  label: inst.trading_name || inst.legal_name,
                }))}
                placeholder="Select institution"
                searchPlaceholder="Search institutions..."
                allOptionLabel="All Institutions"
                emptyText="No institutions found"
                disabled={loadingInstitutions}
                className="w-[180px]"
              />
              
              {/* Clear Filters */}
              {(statusFilter !== "all" || institutionFilter || emailSearch) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setInstitutionFilter("");
                    setEmailSearch("");
                    setOffset(0);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingTable />
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : invites.length === 0 ? (
            <EmptyState
              title="No invites found"
              description={
                statusFilter !== "all"
                  ? "Try adjusting your filter"
                  : "Create your first invite to get started"
              }
              icon={<Mail className="h-12 w-12 text-muted-foreground" />}
            />
          ) : (
            <>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
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
                    {invites.map((invite, index) => {
                      const lastActivity =
                        invite.accepted_at ||
                        invite.clicked_at ||
                        invite.opened_at ||
                        invite.sent_at ||
                        invite.last_attempt_at ||
                        invite.created_at;
                      const rowNum = offset + index + 1;

                      return (
                        <TableRow key={invite.invite_id}>
                          <TableCell className="text-muted-foreground text-sm font-medium tabular-nums w-12">
                            {rowNum}
                          </TableCell>
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
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              {getStatusBadge(invite.status || "QUEUED")}
                              {invite.status === "DECLINED" && (invite.decline_reason || invite.decline_reason_other) && (
                                <span className="text-xs text-muted-foreground" title={getDeclineReasonLabel(invite.decline_reason, invite.decline_reason_other)}>
                                  {getDeclineReasonLabel(invite.decline_reason, invite.decline_reason_other)}
                                </span>
                              )}
                            </div>
                          </TableCell>
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
                                <span title={invite.failure_reason} aria-label={invite.failure_reason}>
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 cursor-help" />
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
                <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Rows per page</span>
                    <Select
                      value={String(pageSize)}
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
                    <span className="text-sm text-gray-500">
                      Showing {offset + 1} to {Math.min(offset + pageSize, total)} of {total}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOffset(Math.max(0, offset - pageSize))}
                        disabled={offset === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOffset(offset + pageSize)}
                        disabled={offset + pageSize >= total}
                      >
                        Next
                      </Button>
                    </div>
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
            setCreateFormData({ email: "", role: "", institution_id: "", default_province: "" });
            setSelectedInstitution(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl rounded-2xl border-border/80 shadow-xl bg-card">
          {createdInvite ? (
            <>
              <DialogHeader className="space-y-1.5 pb-4 border-b border-border">
                <DialogTitle className="text-xl font-semibold tracking-tight">Invite Created</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Copy the invite link and share it with the user
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="rounded-xl p-4 space-y-2 border border-border bg-muted/40">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">{createdInvite.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Role</p>
                    <p className="text-sm text-foreground">
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
                  <p className="text-xs text-muted-foreground">
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
                    setCreateFormData({ email: "", role: "", institution_id: "", default_province: "" });
                    setSelectedInstitution(null);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleCreateInvite}>
              <DialogHeader className="space-y-1.5 pb-4 border-b border-border">
                <DialogTitle className="text-xl font-semibold tracking-tight">Create New Invite</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Send an invitation to join Yiba Verified
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-5 max-h-[60vh] overflow-y-auto pr-1">
                {/* Role Selection - First Step */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-foreground">Role *</Label>
                  <Select
                    id="role"
                    value={createFormData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setCreateFormData({
                        ...createFormData,
                        role: newRole,
                        institution_id: "",
                        default_province: "",
                      });
                      setSelectedInstitution(null);
                    }}
                    required
                    className="h-10 rounded-lg border-border bg-background"
                  >
                    <option value="">Select role</option>
                    <option value="PLATFORM_ADMIN">Platform Admin</option>
                    <option value="ADVISOR">Advisor (service requests)</option>
                    <option value="QCTO_SUPER_ADMIN">QCTO Super Admin</option>
                    <option value="QCTO_ADMIN">QCTO Admin</option>
                    <option value="QCTO_USER">QCTO User</option>
                    <option value="QCTO_REVIEWER">QCTO Reviewer</option>
                    <option value="QCTO_AUDITOR">QCTO Auditor</option>
                    <option value="QCTO_VIEWER">QCTO Viewer</option>
                    <option value="INSTITUTION_ADMIN">Institution Admin</option>
                    <option value="INSTITUTION_STAFF">Institution Staff</option>
                    <option value="STUDENT">Student</option>
                  </Select>
                </div>

                {/* Dynamic Fields Based on Role */}
                {createFormData.role && (
                  <>
                    {/* Email - Always shown after role selection */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={createFormData.email}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, email: e.target.value })
                        }
                        required
                        placeholder="user@example.com"
                        className="h-10 rounded-lg border-border"
                      />
                    </div>

                    {/* Province Selection for QCTO Roles */}
                    {getRoleFields().needsProvince && (
                      <div className="space-y-2">
                        <Label htmlFor="province" className="text-sm font-medium text-foreground">Province *</Label>
                        <Select
                          id="province"
                          value={createFormData.default_province}
                          onChange={(e) =>
                            setCreateFormData({ ...createFormData, default_province: e.target.value })
                          }
                          required
                          className="h-10 rounded-lg border-border bg-background"
                        >
                          <option value="">Select province</option>
                          {PROVINCES.map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          This will set the user's default province and assigned provinces.
                        </p>
                      </div>
                    )}

                    {/* Institution Selection for Institution Roles */}
                    {getRoleFields().needsInstitution && (
                      <div className="space-y-2">
                        <Label htmlFor="institution_id" className="text-sm font-medium text-foreground">
                          Institution {getRoleFields().institutionRequired ? "*" : "(optional)"}
                        </Label>
                        <InstitutionSearch
                          value={createFormData.institution_id}
                          onChange={(institutionId, institution) => {
                            setCreateFormData({ ...createFormData, institution_id: institutionId || "" });
                            setSelectedInstitution(institution);
                          }}
                          showAdminInfo={getRoleFields().showAdminInfo}
                          placeholder="Search institutions by name or registration number..."
                          disabled={createLoading}
                        />
                        {createFormData.role === "INSTITUTION_ADMIN" && (
                          <p className="text-xs text-muted-foreground">
                            Leave blank to let the admin add institution(s) during onboarding.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <DialogFooter className="gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={createLoading}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading || !createFormData.role} className="rounded-lg">
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
