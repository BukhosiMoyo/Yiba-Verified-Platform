"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { ChipEmailInput } from "@/components/shared/ChipEmailInput";
import {
  Search,
  Users as UsersIcon,
  Edit,
  Loader2,
  X,
  Plus,
  Eye,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PROVINCES } from "@/lib/provinces";

const PAGE_SIZE_KEY = "yv_table_page_size:platform_admin_users";
const PINS_KEY = "yv_table_pins:platform_admin_users";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const PREFETCH_VIEW_ROWS = 20;

const COLUMNS = [
  { id: "index", label: "#", minWidth: 48, sortable: false },
  { id: "name", label: "Name", minWidth: 140, sortable: true },
  { id: "email", label: "Email", minWidth: 180, sortable: true },
  { id: "phone", label: "Phone", minWidth: 120, sortable: false },
  { id: "role", label: "Role", minWidth: 170, sortable: true },
  { id: "status", label: "Status", minWidth: 120, sortable: true },
  { id: "institution", label: "Institution", minWidth: 140, sortable: true },
  { id: "joined", label: "Joined", minWidth: 110, sortable: true },
  { id: "actions", label: "Actions", minWidth: 160, sortable: false },
] as const;

type UserRow = {
  user_id: string;
  email: string | null;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  phone: string | null;
  created_at: Date | string;
  institution_id: string | null;
  institution: {
    institution_id: string;
    legal_name: string;
    trading_name: string | null;
  } | null;
};

type InstitutionOption = {
  institution_id: string;
  legal_name: string;
  trading_name: string | null;
};

export interface UsersTableClientProps {
  users: UserRow[];
  total: number;
  institutions: InstitutionOption[];
  initialQ: string;
  initialRole: string;
  initialStatus: string;
  initialInstitutionId: string;
  limit: number;
  offset: number;
}

function getRoleBadgeProps(role: string): {
  variant: "default" | "secondary" | "warning" | "outline";
  className?: string;
} {
  switch (role) {
    case "PLATFORM_ADMIN":
      return { variant: "default" };
    case "QCTO_SUPER_ADMIN":
      return {
        variant: "default",
        className: "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-950/50 dark:text-blue-300",
      };
    case "QCTO_ADMIN":
      return {
        variant: "default",
        className: "bg-indigo-100 text-indigo-700 border-transparent dark:bg-indigo-950/50 dark:text-indigo-300",
      };
    case "QCTO_USER":
      return {
        variant: "outline",
        className: "bg-teal-100 text-teal-700 border-transparent dark:bg-teal-950/50 dark:text-teal-300",
      };
    case "QCTO_REVIEWER":
      return {
        variant: "outline",
        className: "bg-cyan-100 text-cyan-700 border-transparent dark:bg-cyan-950/50 dark:text-cyan-300",
      };
    case "QCTO_AUDITOR":
      return {
        variant: "outline",
        className: "bg-sky-100 text-sky-700 border-transparent dark:bg-sky-950/50 dark:text-sky-300",
      };
    case "QCTO_VIEWER":
      return {
        variant: "outline",
        className: "bg-slate-100 text-slate-700 border-transparent dark:bg-slate-800/50 dark:text-slate-300",
      };
    case "INSTITUTION_ADMIN":
      return {
        variant: "outline",
        className: "bg-violet-100 text-violet-700 border-transparent dark:bg-violet-950/50 dark:text-violet-300",
      };
    case "INSTITUTION_STAFF":
      return { variant: "warning" };
    case "STUDENT":
      return { variant: "secondary" };
    default:
      return { variant: "outline" };
  }
}

export function UsersTableClient({
  users,
  total,
  institutions,
  initialQ,
  initialRole,
  initialStatus,
  initialInstitutionId,
  limit,
  offset,
}: UsersTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [institutionFilter, setInstitutionFilter] = useState(initialInstitutionId);
  const [pins, setPinsState] = useState<Record<string, "left" | "right">>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
    institution_id: "",
  });

  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserFormData, setAddUserFormData] = useState({
    emails: [] as string[],
    role: "",
    institution_id: "",
    default_province: "",
  });

  useEffect(() => {
    setSearchQuery(initialQ);
    setRoleFilter(initialRole);
    setStatusFilter(initialStatus);
    setInstitutionFilter(initialInstitutionId);
  }, [initialQ, initialRole, initialStatus, initialInstitutionId]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PINS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, "left" | "right">;
        if (parsed && typeof parsed === "object") setPinsState(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const prefetchView = (path: string) => () => {
    if (path?.startsWith("/")) router.prefetch(path);
  };

  const buildParams = (updates: {
    q?: string;
    role?: string;
    status?: string;
    institution_id?: string;
    limit?: number;
    offset?: number;
  }) => {
    const p = new URLSearchParams(searchParams.toString());
    const qq = updates.q !== undefined ? updates.q : initialQ;
    const r = updates.role !== undefined ? updates.role : initialRole;
    const s = updates.status !== undefined ? updates.status : initialStatus;
    const iid = updates.institution_id !== undefined ? updates.institution_id : initialInstitutionId;
    const lim = updates.limit ?? limit;
    const off = updates.offset ?? offset;
    if (qq) p.set("q", qq);
    else p.delete("q");
    if (r) p.set("role", r);
    else p.delete("role");
    if (s) p.set("status", s);
    else p.delete("status");
    if (iid) p.set("institution_id", iid);
    else p.delete("institution_id");
    p.set("limit", String(lim));
    p.set("offset", String(off));
    return p.toString();
  };

  const handleSearch = (v: string) => {
    setSearchQuery(v);
    router.push(`?${buildParams({ q: v, offset: 0 })}`, { scroll: false });
  };
  const handleRoleFilter = (v: string) => {
    setRoleFilter(v);
    router.push(`?${buildParams({ role: v, offset: 0 })}`, { scroll: false });
  };
  const handleStatusFilter = (v: string) => {
    setStatusFilter(v);
    router.push(`?${buildParams({ status: v, offset: 0 })}`, { scroll: false });
  };
  const handleInstitutionFilter = (v: string) => {
    setInstitutionFilter(v);
    router.push(`?${buildParams({ institution_id: v, offset: 0 })}`, { scroll: false });
  };
  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
    setInstitutionFilter("");
    router.push(`?${buildParams({ q: "", role: "", status: "", institution_id: "", offset: 0 })}`, {
      scroll: false,
    });
  };

  const handlePageSizeChange = (size: number) => {
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch {
      /* ignore */
    }
    router.push(`?${buildParams({ limit: size, offset: 0 })}`, { scroll: false });
  };

  const setPin = (colId: string, side: "left" | "right" | null) => {
    setPinsState((prev) => {
      const next = { ...prev };
      if (side) next[colId] = side;
      else delete next[colId];
      try {
        localStorage.setItem(PINS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const goPrev = () => {
    router.push(`?${buildParams({ offset: Math.max(0, offset - limit) })}`, { scroll: false });
  };
  const goNext = () => {
    if (offset + limit >= total) return;
    router.push(`?${buildParams({ offset: offset + limit })}`, { scroll: false });
  };

  const openEditModal = (user: UserRow) => {
    setEditingUser(user);
    setEditFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      status: user.status || "",
      institution_id: user.institution_id || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setEditLoading(true);
      const payload: Record<string, unknown> = { user_id: editingUser.user_id };
      if (editFormData.first_name !== (editingUser.first_name || ""))
        payload.first_name = editFormData.first_name;
      if (editFormData.last_name !== (editingUser.last_name || ""))
        payload.last_name = editFormData.last_name;
      if (editFormData.email !== (editingUser.email || "")) payload.email = editFormData.email;
      if (editFormData.phone !== (editingUser.phone || "")) payload.phone = editFormData.phone;
      if (editFormData.role !== (editingUser.role || "")) payload.role = editFormData.role;
      if (editFormData.status !== (editingUser.status || "")) payload.status = editFormData.status;
      const curInst = editingUser.institution_id || null;
      const newInst = editFormData.institution_id || null;
      if (curInst !== newInst) payload.institution_id = newInst;

      const res = await fetch("/api/platform-admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }
      toast.success("User updated successfully");
      setEditModalOpen(false);
      setEditingUser(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const needsInst =
      addUserFormData.role === "INSTITUTION_STAFF" ||
      addUserFormData.role === "STUDENT";
    const needsProvince =
      ["QCTO_ADMIN", "QCTO_USER", "QCTO_REVIEWER", "QCTO_AUDITOR", "QCTO_VIEWER"].includes(
        addUserFormData.role
      );
    if (needsInst && !addUserFormData.institution_id) {
      toast.error("Institution is required for this role");
      return;
    }
    if (needsProvince && !addUserFormData.default_province) {
      toast.error("Province is required for this role");
      return;
    }

    // Emails are already an array
    const emails = addUserFormData.emails;

    if (emails.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }

    try {
      setAddUserLoading(true);
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // Loop and send invites sequentially (or parallelLimit)
      for (const email of emails) {
        try {
          const res = await fetch("/api/invites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email,
              role: addUserFormData.role,
              institution_id: addUserFormData.institution_id || null,
              default_province: addUserFormData.default_province || null,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed");
          }
          successCount++;
        } catch (err) {
          failCount++;
          errors.push(`${email}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Sent ${successCount} invite${successCount !== 1 ? "s" : ""}`);
      }

      if (failCount > 0) {
        toast.error(`Failed to send ${failCount} invite${failCount !== 1 ? "s" : ""}`);
        console.error("Invite errors:", errors);
      }

      setAddUserModalOpen(false);
      setAddUserFormData({ emails: [], role: "", institution_id: "", default_province: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process invites");
    } finally {
      setAddUserLoading(false);
    }
  };

  const institutionOptions = useMemo(
    () =>
      institutions.map((i) => ({
        value: i.institution_id,
        label: i.trading_name || i.legal_name,
      })),
    [institutions]
  );

  const hasActiveFilters =
    initialQ.trim().length > 0 ||
    !!initialRole ||
    !!initialStatus ||
    !!initialInstitutionId;

  const orderedCols = useMemo(() => {
    const left: (typeof COLUMNS)[number][] = [];
    const mid: (typeof COLUMNS)[number][] = [];
    const right: (typeof COLUMNS)[number][] = [];
    for (const c of COLUMNS) {
      if (pins[c.id] === "left") left.push(c);
      else if (pins[c.id] === "right") right.push(c);
      else mid.push(c);
    }
    return [...left, ...mid, ...right];
  }, [pins]);

  const sortedUsers = useMemo(() => {
    if (!sortKey || !sortDir) return users;
    return [...users].sort((a, b) => {
      let va: string | number | undefined;
      let vb: string | number | undefined;
      switch (sortKey) {
        case "name":
          va = `${a.first_name || ""} ${a.last_name || ""}`.trim() || a.email || "";
          vb = `${b.first_name || ""} ${b.last_name || ""}`.trim() || b.email || "";
          break;
        case "email":
          va = a.email || "";
          vb = b.email || "";
          break;
        case "role":
          va = a.role || "";
          vb = b.role || "";
          break;
        case "status":
          va = a.status || "";
          vb = b.status || "";
          break;
        case "institution":
          va = a.institution?.trading_name || a.institution?.legal_name || "";
          vb = b.institution?.trading_name || b.institution?.legal_name || "";
          break;
        case "joined":
          va = a.created_at ? new Date(a.created_at).getTime() : 0;
          vb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
        default:
          return 0;
      }
      const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [users, sortKey, sortDir]);

  useEffect(() => {
    const toPrefetch = sortedUsers
      .slice(0, PREFETCH_VIEW_ROWS)
      .map((u) => `/platform-admin/users/${u.user_id}`);
    toPrefetch.forEach((path) => router.prefetch(path));
  }, [router, sortedUsers]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onChange={(e) => handleRoleFilter(e.target.value)} className="w-[180px]">
            <option value="">All Roles</option>
            <option value="PLATFORM_ADMIN">Platform Admin</option>
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
          <Select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <SearchableSelect
            value={institutionFilter}
            onChange={handleInstitutionFilter}
            options={institutionOptions}
            placeholder="Select institution"
            searchPlaceholder="Search institutions..."
            allOptionLabel="All Institutions"
            emptyText="No institutions found"
            className="w-[180px]"
          />
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <Button onClick={() => setAddUserModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add user
        </Button>
      </div>

      {users.length === 0 && total === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No users found" : "No users yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your filters or search query"
              : "Users will appear here once they are created"
          }
          icon={<UsersIcon className="h-12 w-12 text-muted-foreground" />}
        />
      ) : users.length === 0 && total > 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No users in current page (showing page {Math.floor(offset / limit) + 1})
          </p>
          <p className="text-xs text-muted-foreground">Total: {total} users found. Try adjusting pagination.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  {orderedCols.map((col) => {
                    const isLeft = pins[col.id] === "left";
                    const isRight = pins[col.id] === "right";
                    let leftOffset = 0;
                    if (isLeft) {
                      const idx = orderedCols.findIndex((c) => c.id === col.id);
                      for (let i = 0; i < idx; i++) leftOffset += orderedCols[i].minWidth;
                    }
                    let rightOffset = 0;
                    if (isRight) {
                      const idx = orderedCols.findIndex((c) => c.id === col.id);
                      for (let i = idx + 1; i < orderedCols.length; i++) rightOffset += orderedCols[i].minWidth;
                    }
                    const stickyStyle =
                      isLeft || isRight
                        ? {
                          position: "sticky" as const,
                          ...(isLeft ? { left: leftOffset, zIndex: 1 } : {}),
                          ...(isRight ? { right: rightOffset, zIndex: 1 } : {}),
                          minWidth: col.minWidth,
                          backgroundColor: "rgb(249, 250, 251)",
                        }
                        : { minWidth: col.minWidth };
                    return (
                      <TableHead key={col.id} className="whitespace-nowrap truncate" style={stickyStyle}>
                        <div className="flex items-center gap-1">
                          <span className="truncate">{col.label}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex size-6 shrink-0 items-center justify-center rounded hover:bg-muted"
                                aria-label={`Column menu for ${col.label}`}
                              >
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {col.sortable && (
                                <>
                                  <DropdownMenuItem onClick={() => { setSortKey(col.id); setSortDir("asc"); }}>
                                    <ArrowUp className="h-3.5 w-3.5 mr-2" /> Asc
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSortKey(col.id); setSortDir("desc"); }}>
                                    <ArrowDown className="h-3.5 w-3.5 mr-2" /> Desc
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem onClick={() => setPin(col.id, "left")}>Pin to left</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPin(col.id, "right")}>Pin to right</DropdownMenuItem>
                              {pins[col.id] && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setPin(col.id, null)}>Unpin</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user, index) => {
                  if (!user?.user_id) return null;
                  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
                  const instName = user.institution?.trading_name || user.institution?.legal_name || "";
                  const joined = user.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    : "—";
                  const roleProps = getRoleBadgeProps(user.role);
                  const isActive = user.status === "ACTIVE";
                  return (
                    <TableRow key={user.user_id}>
                      {orderedCols.map((col) => {
                        const isLeft = pins[col.id] === "left";
                        const isRight = pins[col.id] === "right";
                        let leftOffset = 0;
                        if (isLeft) {
                          const idx = orderedCols.findIndex((c) => c.id === col.id);
                          for (let i = 0; i < idx; i++) leftOffset += orderedCols[i].minWidth;
                        }
                        let rightOffset = 0;
                        if (isRight) {
                          const idx = orderedCols.findIndex((c) => c.id === col.id);
                          for (let i = idx + 1; i < orderedCols.length; i++)
                            rightOffset += orderedCols[i].minWidth;
                        }
                        const stickyStyle =
                          isLeft || isRight
                            ? {
                              position: "sticky" as const,
                              ...(isLeft ? { left: leftOffset, zIndex: 1 } : {}),
                              ...(isRight ? { right: rightOffset, zIndex: 1 } : {}),
                              minWidth: col.minWidth,
                              backgroundColor: "white",
                              boxShadow: isLeft
                                ? "2px 0 4px -2px rgba(0,0,0,0.06)"
                                : isRight
                                  ? "-2px 0 4px -2px rgba(0,0,0,0.06)"
                                  : undefined,
                            }
                            : { minWidth: col.minWidth };
                        const cellClass =
                          "whitespace-nowrap truncate overflow-hidden text-ellipsis max-w-0 " +
                          (col.id === "actions" ? "whitespace-normal" : "");

                        if (col.id === "index") {
                          return (
                            <TableCell key={col.id} className={`${cellClass} text-foreground font-bold`} style={stickyStyle}>
                              {offset + index + 1}
                            </TableCell>
                          );
                        }
                        if (col.id === "name") {
                          return (
                            <TableCell key={col.id} className={`font-medium ${cellClass}`} style={stickyStyle}>
                              <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <span className="block truncate">{fullName || user.email || "—"}</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-md break-words text-xs z-50">
                                    {fullName || user.email || "—"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          );
                        }
                        if (col.id === "email") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              {user.email ? (
                                <TooltipProvider>
                                  <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">{user.email}</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-md break-words text-xs z-50">
                                      {user.email}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          );
                        }
                        if (col.id === "phone") {
                          const v = user.phone || "—";
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <span className="block truncate">{v}</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-md break-words text-xs z-50">
                                    {v}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          );
                        }
                        if (col.id === "role") {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap" style={stickyStyle}>
                              <Badge variant={roleProps.variant} className={roleProps.className}>
                                {user.role?.replace(/_/g, " ") || "—"}
                              </Badge>
                            </TableCell>
                          );
                        }
                        if (col.id === "status") {
                          const isInvited = ["QUEUED", "SENT", "PENDING", "Invited", "Queued"].includes(user.status);
                          let badgeVariant: "default" | "secondary" | "destructive" | "outline" | "success" = isActive ? "success" : "destructive";
                          if (isInvited) badgeVariant = "outline";

                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              {user.status ? (
                                <Badge
                                  variant={badgeVariant}
                                  className="inline-flex items-center gap-1.5"
                                >
                                  {isActive ? (
                                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                                  ) : isInvited ? (
                                    <Loader2 className="h-3.5 w-3.5 shrink-0" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                                  )}
                                  {user.status}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          );
                        }
                        if (col.id === "institution") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              {instName ? (
                                <TooltipProvider>
                                  <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">{instName}</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-md break-words text-xs z-50">
                                      {instName}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          );
                        }
                        if (col.id === "joined") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <span className="block truncate">{joined}</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-md break-words text-xs z-50">
                                    {joined}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          );
                        }
                        if (col.id === "actions") {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap" style={stickyStyle}>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(user)}
                                  className="shrink-0"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Link
                                  href={`/platform-admin/users/${user.user_id}`}
                                  onMouseEnter={prefetchView(`/platform-admin/users/${user.user_id}`)}
                                >
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={(col as { id: string }).id} className={cellClass} style={stickyStyle} />
                        );
                      })}
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

      {/* Edit user modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit user</DialogTitle>
              <DialogDescription>Update user details. Changes take effect immediately.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-first_name">First name</Label>
                  <Input
                    id="edit-first_name"
                    value={editFormData.first_name}
                    onChange={(e) => setEditFormData((p) => ({ ...p, first_name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-last_name">Last name</Label>
                  <Input
                    id="edit-last_name"
                    value={editFormData.last_name}
                    onChange={(e) => setEditFormData((p) => ({ ...p, last_name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  id="edit-role"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData((p) => ({ ...p, role: e.target.value }))}
                  className="mt-1 w-full"
                >
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
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
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  id="edit-status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData((p) => ({ ...p, status: e.target.value }))}
                  className="mt-1 w-full"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
              <div>
                <Label>Institution</Label>
                <SearchableSelect
                  value={editFormData.institution_id}
                  onChange={(v) => setEditFormData((p) => ({ ...p, institution_id: v }))}
                  options={institutionOptions}
                  placeholder="Select institution"
                  searchPlaceholder="Search institutions..."
                  allOptionLabel="None"
                  emptyText="No institutions found"
                  className="mt-1 w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
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

      {/* Add user (invite) modal */}
      <Dialog open={addUserModalOpen} onOpenChange={setAddUserModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleAddUserSubmit}>
            <DialogHeader>
              <DialogTitle>Add user</DialogTitle>
              <DialogDescription>
                Send an invite to create a new user. They will receive an email with a link to sign up.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="add-emails">Emails</Label>
                <ChipEmailInput
                  value={addUserFormData.emails}
                  onChange={(emails) => setAddUserFormData((p) => ({ ...p, emails }))}
                  className="mt-1"
                  placeholder="Type email and press Enter or Comma..."
                />
              </div>
              <div>
                <Label htmlFor="add-role">Role</Label>
                <Select
                  id="add-role"
                  value={addUserFormData.role}
                  onChange={(e) => setAddUserFormData((p) => ({ ...p, role: e.target.value }))}
                  className="mt-1 w-full"
                >
                  <option value="">Select role</option>
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
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
              {["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "STUDENT"].includes(addUserFormData.role) && (
                <div>
                  <Label>Institution</Label>
                  <SearchableSelect
                    value={addUserFormData.institution_id}
                    onChange={(v) => setAddUserFormData((p) => ({ ...p, institution_id: v }))}
                    options={institutionOptions}
                    placeholder="Select institution"
                    searchPlaceholder="Search institutions..."
                    allOptionLabel="None"
                    emptyText="No institutions found"
                    className="mt-1 w-full"
                  />
                </div>
              )}
              {["QCTO_ADMIN", "QCTO_USER", "QCTO_REVIEWER", "QCTO_AUDITOR", "QCTO_VIEWER"].includes(
                addUserFormData.role
              ) && (
                  <div>
                    <Label htmlFor="add-province">Default province</Label>
                    <Select
                      id="add-province"
                      value={addUserFormData.default_province}
                      onChange={(e) =>
                        setAddUserFormData((p) => ({ ...p, default_province: e.target.value }))
                      }
                      className="mt-1 w-full"
                    >
                      <option value="">Select province</option>
                      {PROVINCES.map((pr) => (
                        <option key={pr} value={pr}>
                          {pr}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addUserLoading}>
                {addUserLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
