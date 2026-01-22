"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Plus, Copy, Check, Loader2, Pencil, Search, X } from "lucide-react";
import { toast } from "sonner";

export default function InstitutionInvitesPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Create invite modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: "",
    role: "",
  });
  const [createdInvite, setCreatedInvite] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Edit invite modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvite, setEditingInvite] = useState<any>(null);
  const [editRole, setEditRole] = useState("");
  const [editExtendExpiry, setEditExtendExpiry] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (search) params.set("q", search);
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());

      const response = await fetch(`/api/institution/invites?${params}`);
      
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
  }, [statusFilter, roleFilter, search, limit, offset]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

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
          // institution_id will be automatically set from the caller's context
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

  const copyInviteLink = async () => {
    if (createdInvite?.invite_link) {
      await navigator.clipboard.writeText(createdInvite.invite_link);
      setCopiedToken(true);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => {
        setCopiedToken(false);
        setCreateModalOpen(false);
        setCreatedInvite(null);
        setCreateFormData({ email: "", role: "" });
      }, 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInviteStatus = (invite: any) => {
    if (invite.used_at) {
      return { label: "Used", variant: "default" as const };
    }
    if (new Date() > new Date(invite.expires_at)) {
      return { label: "Expired", variant: "secondary" as const };
    }
    return { label: "Pending", variant: "outline" as const };
  };

  const openEdit = (invite: any) => {
    setEditingInvite(invite);
    setEditRole(invite.role);
    setEditExtendExpiry(false);
    setEditModalOpen(true);
  };

  const closeEdit = () => {
    setEditModalOpen(false);
    setEditingInvite(null);
    setEditRole("");
    setEditExtendExpiry(false);
  };

  const handleEditInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvite) return;
    setEditLoading(true);
    try {
      const body: { role: string; extend_expiry?: boolean } = { role: editRole };
      if (editExtendExpiry) body.extend_expiry = true;

      const res = await fetch(`/api/institution/invites/${editingInvite.invite_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update invite");
      toast.success("Invite updated");
      closeEdit();
      fetchInvites();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update invite");
    } finally {
      setEditLoading(false);
    }
  };

  const applySearch = () => {
    setSearch(searchInput);
    setOffset(0);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setRoleFilter("all");
    setSearch("");
    setSearchInput("");
    setOffset(0);
  };

  const hasActiveFilters = statusFilter !== "all" || roleFilter !== "all" || search !== "";

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-700 to-cyan-800 px-6 py-8 md:px-8 md:py-10 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.14)_0%,_transparent_50%)]" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Mail className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Invites</h1>
              <p className="mt-1 text-teal-100 text-sm md:text-base">
                Invite staff and students to your institution
              </p>
            </div>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invite
          </Button>
        </div>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden border-l-4 border-l-teal-500">
        {/* Filters bar */}
        <div className="border-b border-slate-200/80 bg-gradient-to-r from-teal-50/60 to-white px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px] max-w-xs">
              <Label className="text-slate-600 text-xs font-medium mb-1 block">Search by email</Label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Search by email…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applySearch())}
                    className="pl-9 h-10 border-slate-200/80"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={applySearch} className="h-10 shrink-0 border-slate-200/80">
                  Search
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-slate-600 text-xs font-medium mb-1 block">Status</Label>
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
                className="w-[160px] h-10 border-slate-200/80"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="used">Used</option>
                <option value="expired">Expired</option>
              </Select>
            </div>
            <div>
              <Label className="text-slate-600 text-xs font-medium mb-1 block">Role</Label>
              <Select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setOffset(0); }}
                className="w-[180px] h-10 border-slate-200/80"
              >
                <option value="all">All roles</option>
                <option value="INSTITUTION_ADMIN">Institution Admin</option>
                <option value="INSTITUTION_STAFF">Institution Staff</option>
                <option value="STUDENT">Student</option>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-rose-600">
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
          <div className="mt-3 text-sm text-slate-500">
            {loading ? "Loading…" : `${total} invite${total !== 1 ? "s" : ""} found`}
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 md:py-5">
          {loading ? (
            <LoadingTable />
          ) : error ? (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 py-12 text-center">
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          ) : invites.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-16">
              <EmptyState
                title="No invites found"
                description={
                  hasActiveFilters
                    ? "Try clearing filters or different criteria"
                    : "Create your first invite to get started"
                }
                icon={<Mail className="h-12 w-12 text-slate-400" />}
                variant="default"
              />
            </div>
          ) : (
            <>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                      <TableHead className="w-12 text-center h-11 bg-slate-50/80 font-semibold text-slate-700">#</TableHead>
                      <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Email</TableHead>
                      <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Role</TableHead>
                      <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Expires</TableHead>
                      <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Created By</TableHead>
                      <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Created</TableHead>
                      <TableHead className="sticky right-0 z-10 w-24 min-w-[6rem] h-11 bg-slate-50/80 font-semibold text-slate-700 text-right border-l border-slate-200/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite, index) => {
                      const status = getInviteStatus(invite);
                      return (
                        <TableRow
                          key={invite.invite_id}
                          className="group border-b border-slate-100 last:border-b-0 hover:bg-teal-50/40 transition-colors"
                        >
                          <TableCell className="text-center text-slate-500 text-sm py-4">
                            {offset + index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 py-4">{invite.email}</TableCell>
                          <TableCell className="py-4">
                            <span
                              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                invite.role === "INSTITUTION_ADMIN"
                                  ? "bg-violet-500/12 text-violet-700 border border-violet-200/60"
                                  : invite.role === "INSTITUTION_STAFF"
                                    ? "bg-slate-100 text-slate-600 border border-slate-200/60"
                                    : "bg-sky-500/12 text-sky-700 border border-sky-200/60"
                              }`}
                            >
                              {invite.role.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span
                              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                status.label === "Pending"
                                  ? "bg-emerald-500/12 text-emerald-700 border border-emerald-200/60"
                                  : status.label === "Used"
                                    ? "bg-violet-500/10 text-violet-700 border border-violet-200/60"
                                    : "bg-amber-500/10 text-amber-700 border border-amber-200/60"
                              }`}
                            >
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 py-4">
                            {formatDate(invite.expires_at)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 py-4">
                            {invite.createdBy
                              ? `${invite.createdBy.first_name} ${invite.createdBy.last_name}`.trim() || "—"
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 py-4">
                            {formatDate(invite.created_at)}
                          </TableCell>
                          <TableCell className="sticky right-0 z-10 bg-white group-hover:bg-teal-50/40 border-l border-slate-200/80 text-right py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-500"
                              onClick={() => !invite.used_at && openEdit(invite)}
                              disabled={!!invite.used_at}
                              title={invite.used_at ? "Cannot edit used invite" : "Edit invite"}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ResponsiveTable>

              {/* Pagination */}
              {!loading && invites.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-200/80">
                  <p className="text-sm text-slate-500">
                    Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                      className="border-slate-200 hover:bg-teal-50 hover:border-teal-200"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total}
                      className="border-slate-200 hover:bg-teal-50 hover:border-teal-200"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Invite Modal */}
      <Dialog open={createModalOpen} onOpenChange={(open) => {
        setCreateModalOpen(open);
        if (!open) {
          setCreatedInvite(null);
          setCreateFormData({ email: "", role: "" });
        }
      }}>
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
                <div className="rounded-xl p-4 space-y-2 border border-teal-200/80 bg-teal-50/50">
                  <div>
                    <p className="text-xs font-medium text-teal-700/80">Email</p>
                    <p className="text-sm text-slate-900 font-medium">{createdInvite.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-teal-700/80">Role</p>
                    <p className="text-sm text-slate-900">
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
                    This link expires in 7 days
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setCreatedInvite(null);
                    setCreateFormData({ email: "", role: "" });
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
                  Invite staff or students to join your institution
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
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, role: e.target.value })
                    }
                    required
                  >
                    <option value="">Select role</option>
                    <option value="INSTITUTION_ADMIN">Institution Admin</option>
                    <option value="INSTITUTION_STAFF">Institution Staff</option>
                    <option value="STUDENT">Student</option>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Institution admins can invite admins, staff, or students
                  </p>
                </div>
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

      {/* Edit Invite Modal */}
      <Dialog open={editModalOpen} onOpenChange={(o) => { setEditModalOpen(o); if (!o) closeEdit(); }}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleEditInvite}>
            <DialogHeader>
              <DialogTitle>Edit invite</DialogTitle>
              <DialogDescription>
                {editingInvite?.email} — change role or extend expiry. Used invites cannot be edited.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <option value="INSTITUTION_ADMIN">Institution Admin</option>
                  <option value="INSTITUTION_STAFF">Institution Staff</option>
                  <option value="STUDENT">Student</option>
                </Select>
              </div>
              <Checkbox
                id="edit-extend"
                checked={editExtendExpiry}
                onChange={(e) => setEditExtendExpiry(e.target.checked)}
                label="Extend expiry by 7 days from now"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEdit} disabled={editLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
