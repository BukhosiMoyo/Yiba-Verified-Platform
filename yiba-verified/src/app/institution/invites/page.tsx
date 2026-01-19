"use client";

import { useState, useEffect } from "react";
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
import { Mail, Plus, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InstitutionInvitesPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invites</h1>
          <p className="text-sm text-gray-500 mt-1">
            Invite staff and students to your institution
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Invite
        </Button>
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
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setOffset(0);
              }}
              className="w-48"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </Select>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => {
                      const status = getInviteStatus(invite);
                      return (
                        <TableRow key={invite.invite_id}>
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {invite.role.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(invite.expires_at)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {invite.createdBy
                              ? `${invite.createdBy.first_name} ${invite.createdBy.last_name}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(invite.created_at)}
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
                    <option value="INSTITUTION_STAFF">Institution Staff</option>
                    <option value="STUDENT">Student</option>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Institution admins can only invite staff and students
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
    </div>
  );
}
