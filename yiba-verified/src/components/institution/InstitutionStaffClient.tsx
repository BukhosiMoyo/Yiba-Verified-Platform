"use client";

import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { Users, Plus, UserX, UserCheck, Copy, Check, Loader2, GraduationCap, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { GenerateImpersonationLink } from "@/components/shared/GenerateImpersonationLink";
import type { Role } from "@/lib/rbac";

const roleLabel = (r: string) => {
  const m: Record<string, string> = {
    INSTITUTION_ADMIN: "Institution Admin",
    INSTITUTION_STAFF: "Staff",
  };
  return m[r] || r.replace(/_/g, " ");
};

type StaffMember = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  status: string;
  created_at: Date | null;
  can_facilitate?: boolean;
  can_assess?: boolean;
  can_moderate?: boolean;
};

type Props = {
  staff: StaffMember[];
  canManage: boolean;
  currentUserId: string;
  currentUserRole: Role;
};

export function InstitutionStaffClient({ staff, canManage, currentUserId, currentUserRole }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("INSTITUTION_STAFF");
  const [addLoading, setAddLoading] = useState(false);
  const [addResult, setAddResult] = useState<{ invite_link: string; email: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [facilitatorTogglingId, setFacilitatorTogglingId] = useState<string | null>(null);

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddResult(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim(), role: addRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invite");
      setAddResult({ invite_link: data.invite_link, email: data.email, role: data.role });
      toast.success("Invite created. Share the link with them.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setAddLoading(false);
    }
  };

  const copyLink = async () => {
    if (addResult?.invite_link) {
      await navigator.clipboard.writeText(addResult.invite_link);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeAdd = () => {
    setAddOpen(false);
    setAddResult(null);
    setAddEmail("");
    setAddRole("INSTITUTION_STAFF");
    router.refresh();
  };

  const setStatus = async (userId: string, status: "ACTIVE" | "INACTIVE") => {
    setTogglingId(userId);
    try {
      const res = await fetch(`/api/institution/staff/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success(status === "ACTIVE" ? "Staff enabled" : "Staff disabled");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setTogglingId(null);
    }
  };

  const setCanFacilitate = async (userId: string, can_facilitate: boolean) => {
    setFacilitatorTogglingId(userId);
    try {
      const res = await fetch(`/api/institution/staff/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ can_facilitate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success(can_facilitate ? "Marked as facilitator" : "Removed as facilitator");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setFacilitatorTogglingId(null);
    }
  };

  const cols = canManage ? 7 : 6;

  return (
    <>
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden border-l-4 border-l-violet-500">
        <div className="border-b border-slate-200/80 bg-gradient-to-r from-violet-50/60 to-white px-6 py-4 md:px-8 md:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Team</h2>
            <div className="flex items-center gap-2">
              {canManage && (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add staff
                </Button>
              )}
              <span className="inline-flex items-center rounded-lg bg-violet-500/10 px-3 py-1.5 text-sm font-medium text-violet-700">
                {staff.length} member{staff.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 md:py-5">
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                  <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Name</TableHead>
                  <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Email</TableHead>
                  <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Role</TableHead>
                  <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Facilitator</TableHead>
                  <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700">Joined</TableHead>
                  {canManage && (
                    <TableHead className="h-11 bg-slate-50/80 font-semibold text-slate-700 text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={cols} className="py-16">
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12">
                        <EmptyState
                          title="No staff found"
                          description="Invite staff from this page or the Invites area."
                          icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
                          variant="default"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((u) => {
                    const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                    const initial = (u.first_name?.[0] || u.email?.[0] || "?").toUpperCase();
                    const isSelf = u.user_id === currentUserId;
                    return (
                      <TableRow
                        key={u.user_id}
                        className="group border-b border-slate-100 last:border-b-0 hover:bg-violet-50/40 transition-colors"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-semibold text-sm ${
                                u.role === "INSTITUTION_ADMIN"
                                  ? "bg-violet-500/15 text-violet-700"
                                  : "bg-slate-200/80 text-slate-600"
                              }`}
                            >
                              {initial}
                            </div>
                            <span className="font-medium text-slate-900">{name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-slate-600">{u.email}</TableCell>
                        <TableCell className="py-4">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              u.role === "INSTITUTION_ADMIN"
                                ? "bg-violet-500/12 text-violet-700 border border-violet-200/60"
                                : "bg-slate-100 text-slate-600 border border-slate-200/60"
                            }`}
                          >
                            {roleLabel(u.role)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          {canManage && !isSelf ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors disabled:opacity-50"
                              style={
                                u.can_facilitate
                                  ? { background: "rgb(34 197 94 / 0.12)", color: "rgb(22 163 74)", borderColor: "rgb(34 197 94 / 0.4)" }
                                  : { background: "rgb(241 245 249)", color: "rgb(100 116 139)", borderColor: "rgb(226 232 240)" }
                              }
                              disabled={!!facilitatorTogglingId}
                              onClick={() => setCanFacilitate(u.user_id, !u.can_facilitate)}
                            >
                              {facilitatorTogglingId === u.user_id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <GraduationCap className="h-3.5 w-3.5" />
                              )}
                              {u.can_facilitate ? "Yes" : "No"}
                            </button>
                          ) : u.can_facilitate ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                              <GraduationCap className="h-3.5 w-3.5" />
                              Yes
                              {isSelf && (
                                <a
                                  href="/institution/facilitator-profile"
                                  className="inline-flex items-center gap-1 text-violet-600 hover:underline"
                                >
                                  <Link2 className="h-3 w-3" />
                                  Complete profile
                                </a>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              u.status === "ACTIVE"
                                ? "bg-emerald-500/12 text-emerald-700 border border-emerald-200/60"
                                : "bg-amber-500/10 text-amber-700 border border-amber-200/60"
                            }`}
                          >
                            {u.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-sm text-slate-500">{formatDate(u.created_at)}</TableCell>
                        {canManage && (
                          <TableCell className="py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!isSelf && (
                                <>
                                  <GenerateImpersonationLink
                                    targetUserId={u.user_id}
                                    targetUserName={name}
                                    targetUserRole={roleLabel(u.role)}
                                    variant="ghost"
                                    size="sm"
                                    showLabel={false}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-slate-600 hover:text-rose-600"
                                    disabled={!!togglingId}
                                    onClick={() => setStatus(u.user_id, u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                                  >
                                    {togglingId === u.user_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : u.status === "ACTIVE" ? (
                                      <span title="Disable"><UserX className="h-4 w-4" /></span>
                                    ) : (
                                      <span title="Enable"><UserCheck className="h-4 w-4" /></span>
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setAddResult(null); setAddEmail(""); setAddRole("INSTITUTION_STAFF"); } }}>
        <DialogContent className="sm:max-w-[480px]">
          {addResult ? (
            <>
              <DialogHeader>
                <DialogTitle>Invite created</DialogTitle>
                <DialogDescription>Share this link with them. It expires in 7 days.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="rounded-lg border bg-slate-50/80 p-3 text-sm">
                  <p className="text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">{addResult.email}</p>
                </div>
                <div className="rounded-lg border bg-slate-50/80 p-3 text-sm">
                  <p className="text-slate-500">Role</p>
                  <p className="font-medium text-slate-900">{addResult.role.replace(/_/g, " ")}</p>
                </div>
                <div className="flex gap-2">
                  <Input readOnly value={addResult.invite_link} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copyLink} disabled={copied}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={closeAdd}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Add staff</DialogTitle>
                <DialogDescription>Invite someone to your institution. They will get a link to join.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email *</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-role">Role *</Label>
                  <Select id="add-role" value={addRole} onChange={(e) => setAddRole(e.target.value)}>
                    <option value="INSTITUTION_STAFF">Institution Staff</option>
                    <option value="INSTITUTION_ADMIN">Institution Admin</option>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setAddOpen(false); }} disabled={addLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addLoading}>
                  {addLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create invite
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
