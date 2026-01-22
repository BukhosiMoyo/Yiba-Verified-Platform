"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Users as UsersIcon, Edit, Loader2, X, Plus, Eye, ChevronDown, ArrowUp, ArrowDown, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const PAGE_SIZE_KEY = "yv_table_page_size:platform_admin_users";
const PINS_KEY = "yv_table_pins:platform_admin_users";
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

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

function UsersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [institutionFilter, setInstitutionFilter] = useState(searchParams.get("institution_id") || "");
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [pins, setPinsState] = useState<Record<string, "left" | "right">>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
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

  // Add user (invite) modal state
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserFormData, setAddUserFormData] = useState({
    email: "",
    role: "",
    institution_id: "",
  });

  // Load pageSize and pins from localStorage (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (ROWS_PER_PAGE_OPTIONS.includes(n as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
          setPageSizeState(n);
        }
      }
      const storedPins = localStorage.getItem(PINS_KEY);
      if (storedPins) {
        const parsed = JSON.parse(storedPins) as Record<string, "left" | "right">;
        if (parsed && typeof parsed === "object") setPinsState(parsed);
      }
    } catch (_) { /* ignore */ }
  }, []);

  // Fetch institutions for filter dropdown
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
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, roleFilter, statusFilter, institutionFilter, offset, pageSize]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery.trim() && searchQuery.length >= 2) {
        params.set("q", searchQuery.trim());
      }
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (institutionFilter) params.set("institution_id", institutionFilter);
      params.set("limit", pageSize.toString());
      params.set("offset", offset.toString());

      const response = await fetch(`/api/platform-admin/users?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch users");
      }

      const data = await response.json();
      
      // The API returns { count, total, items }
      // Handle both direct response and wrapped response
      const items = Array.isArray(data.items) ? data.items : (data.data?.items || []);
      const total = typeof data.total === 'number' ? data.total : (data.data?.total || 0);
      
      // If we have a total but no items and we're not on the first page, reset to first page
      if (total > 0 && items.length === 0 && offset > 0) {
        setOffset(0);
        return; // Will trigger a new fetch with offset 0
      }
      
      setUsers(items);
      setTotal(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setOffset(0);
    updateURL();
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    setOffset(0);
    updateURL();
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setOffset(0);
    updateURL();
  };

  const handleInstitutionFilter = (value: string) => {
    setInstitutionFilter(value);
    setOffset(0);
    updateURL();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
    setInstitutionFilter("");
    setOffset(0);
    updateURL();
  };

  const handlePageSizeChange = (size: number) => {
    setPageSizeState(size);
    setOffset(0);
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch (_) { /* ignore */ }
  };

  const setPin = (colId: string, side: "left" | "right" | null) => {
    setPinsState((prev) => {
      const next = { ...prev };
      if (side) next[colId] = side;
      else delete next[colId];
      try {
        localStorage.setItem(PINS_KEY, JSON.stringify(next));
      } catch (_) { /* ignore */ }
      return next;
    });
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim() && searchQuery.length >= 2) params.set("q", searchQuery.trim());
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (institutionFilter) params.set("institution_id", institutionFilter);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const openEditModal = (user: any) => {
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
      const response = await fetch("/api/platform-admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: editingUser.user_id,
          ...editFormData,
          institution_id: editFormData.institution_id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      toast.success("User updated successfully");
      setEditModalOpen(false);
      setEditingUser(null);
      fetchUsers(); // Refresh the list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const needsInstitution =
      addUserFormData.role === "INSTITUTION_ADMIN" ||
      addUserFormData.role === "INSTITUTION_STAFF" ||
      addUserFormData.role === "STUDENT";
    if (needsInstitution && !addUserFormData.institution_id) {
      toast.error("Institution is required for this role");
      return;
    }
    try {
      setAddUserLoading(true);
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addUserFormData.email.trim(),
          role: addUserFormData.role,
          institution_id: addUserFormData.institution_id || null,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create invite");
      }
      toast.success(`Invite sent to ${addUserFormData.email.trim()}`);
      setAddUserModalOpen(false);
      setAddUserFormData({ email: "", role: "", institution_id: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setAddUserLoading(false);
    }
  };

  const getRoleBadgeProps = (role: string): { variant: "default" | "secondary" | "warning" | "outline"; className?: string } => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return { variant: "default" };
      case "INSTITUTION_ADMIN":
        return { variant: "outline", className: "bg-violet-100 text-violet-700 border-transparent" };
      case "INSTITUTION_STAFF":
        return { variant: "warning" };
      case "QCTO_USER":
        return { variant: "outline", className: "bg-teal-100 text-teal-700 border-transparent" };
      case "STUDENT":
        return { variant: "secondary" };
      default:
        return { variant: "outline" };
    }
  };

  const hasActiveFilters = searchQuery.trim().length >= 2 || roleFilter || statusFilter || institutionFilter;

  // Column order: left-pinned, unpinned, right-pinned
  const orderedCols = useMemo(() => {
    const left: typeof COLUMNS[number][] = [];
    const mid: typeof COLUMNS[number][] = [];
    const right: typeof COLUMNS[number][] = [];
    for (const c of COLUMNS) {
      if (pins[c.id] === "left") left.push(c);
      else if (pins[c.id] === "right") right.push(c);
      else mid.push(c);
    }
    return [...left, ...mid, ...right];
  }, [pins]);

  // Client-side sort (current page only; API unchanged)
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage platform users and their roles
            </p>
          </div>
        </div>

        {/* Toolbar: search, filters, Add user */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="w-[160px]"
            >
              <option value="">All Roles</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
              <option value="INSTITUTION_ADMIN">Institution Admin</option>
              <option value="INSTITUTION_STAFF">Institution Staff</option>
              <option value="QCTO_USER">QCTO User</option>
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
            <Select
              value={institutionFilter}
              onChange={(e) => handleInstitutionFilter(e.target.value)}
              disabled={loadingInstitutions}
              className="w-[180px]"
            >
              <option value="">All Institutions</option>
              {institutions.map((inst) => (
                <option key={inst.institution_id} value={inst.institution_id}>
                  {inst.trading_name || inst.legal_name}
                </option>
              ))}
            </Select>
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

        {loading ? (
          <LoadingTable />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : users.length === 0 && total === 0 ? (
          <EmptyState
            title={hasActiveFilters ? "No users found" : "No users yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your filters or search query"
                : "Users will appear here once they are created"
            }
            icon={<UsersIcon className="h-12 w-12 text-gray-400" />}
          />
        ) : users.length === 0 && total > 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-600 mb-2">
              No users in current page (showing page {Math.floor(offset / pageSize) + 1})
            </p>
            <p className="text-xs text-gray-500">
              Total: {total} users found. Try adjusting pagination.
            </p>
          </div>
        ) : (
          <>
            {/* Table container: border, rounded, scroll inside */}
            <div className="rounded-xl border border-gray-200/60 overflow-x-auto bg-white">
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
                        <TableHead
                          key={col.id}
                          className="whitespace-nowrap truncate"
                          style={stickyStyle}
                        >
                          <div className="flex items-center gap-1">
                            <span className="truncate">{col.label}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex size-6 shrink-0 items-center justify-center rounded hover:bg-gray-200/60"
                                  aria-label={`Column menu for ${col.label}`}
                                >
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                {col.sortable && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSortKey(col.id);
                                        setSortDir("asc");
                                      }}
                                    >
                                      <ArrowUp className="h-3.5 w-3.5 mr-2" />
                                      Asc
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSortKey(col.id);
                                        setSortDir("desc");
                                      }}
                                    >
                                      <ArrowDown className="h-3.5 w-3.5 mr-2" />
                                      Desc
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => setPin(col.id, "left")}>
                                  Pin to left
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setPin(col.id, "right")}>
                                  Pin to right
                                </DropdownMenuItem>
                                {pins[col.id] && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setPin(col.id, null)}>
                                      Unpin
                                    </DropdownMenuItem>
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
                  {sortedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={orderedCols.length} className="text-center py-8 text-gray-500">
                        No users to display
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedUsers.map((user, index) => {
                      if (!user || !user.user_id) return null;
                      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
                      const instName = user.institution?.trading_name || user.institution?.legal_name || "";
                      const joined = user.created_at
                        ? new Date(user.created_at).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—";
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
                                <TableCell key={col.id} className={`${cellClass} text-gray-800 font-bold`} style={stickyStyle}>
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
                              const roleProps = getRoleBadgeProps(user.role);
                              return (
                                <TableCell
                                  key={col.id}
                                  className="whitespace-nowrap"
                                  style={stickyStyle}
                                >
                                  <Badge
                                    variant={roleProps.variant}
                                    className={roleProps.className}
                                  >
                                    {user.role?.replace(/_/g, " ") || "—"}
                                  </Badge>
                                </TableCell>
                              );
                            }
                            if (col.id === "status") {
                              const isActive = user.status === "ACTIVE";
                              return (
                                <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                                  {user.status ? (
                                    <Badge
                                      variant={isActive ? "success" : "destructive"}
                                      className="inline-flex items-center gap-1.5"
                                    >
                                      {isActive ? (
                                        <CheckCircle className="h-3.5 w-3.5 shrink-0" />
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
                                  <div className="flex gap-2">
                                    <Link href={`/platform-admin/users/${user.user_id}`}>
                                      <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4 mr-2 text-gray-600" />
                                        View
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditModal(user)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Quick Edit
                                    </Button>
                                  </div>
                                </TableCell>
                              );
                            }
                            return <TableCell key={(col as { id: string }).id} className={cellClass} style={stickyStyle} />;
                          })}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer: Rows per page (left), pagination (right) */}
            {!loading && users.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
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
      </div>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and settings
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={editFormData.first_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, first_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={editFormData.last_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, last_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    id="role"
                    value={editFormData.role}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, role: e.target.value })
                    }
                    required
                  >
                    <option value="PLATFORM_ADMIN">Platform Admin</option>
                    <option value="INSTITUTION_ADMIN">Institution Admin</option>
                    <option value="INSTITUTION_STAFF">Institution Staff</option>
                    <option value="QCTO_USER">QCTO User</option>
                    <option value="STUDENT">Student</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value })
                    }
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution_id">Institution</Label>
                <Select
                  id="institution_id"
                  value={editFormData.institution_id}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, institution_id: e.target.value })
                  }
                >
                  <option value="">No Institution</option>
                  {institutions.map((inst) => (
                    <option key={inst.institution_id} value={inst.institution_id}>
                      {inst.trading_name || inst.legal_name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add User (Invite) Modal */}
      <Dialog
        open={addUserModalOpen}
        onOpenChange={(open) => {
          setAddUserModalOpen(open);
          if (!open) setAddUserFormData({ email: "", role: "", institution_id: "" });
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleAddUserSubmit}>
            <DialogHeader>
              <DialogTitle>Add user</DialogTitle>
              <DialogDescription>
                Send an invitation. They will become a user once they accept.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-user-email">Email *</Label>
                <Input
                  id="add-user-email"
                  type="email"
                  value={addUserFormData.email}
                  onChange={(e) =>
                    setAddUserFormData({ ...addUserFormData, email: e.target.value })
                  }
                  required
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-user-role">Role *</Label>
                <Select
                  id="add-user-role"
                  value={addUserFormData.role}
                  onChange={(e) => {
                    setAddUserFormData({
                      ...addUserFormData,
                      role: e.target.value,
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
              {(addUserFormData.role === "INSTITUTION_ADMIN" ||
                addUserFormData.role === "INSTITUTION_STAFF" ||
                addUserFormData.role === "STUDENT") && (
                <div className="space-y-2">
                  <Label htmlFor="add-user-institution">Institution *</Label>
                  <Select
                    id="add-user-institution"
                    value={addUserFormData.institution_id}
                    onChange={(e) =>
                      setAddUserFormData({ ...addUserFormData, institution_id: e.target.value })
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
                onClick={() => setAddUserModalOpen(false)}
                disabled={addUserLoading}
              >
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

export default function UsersPage() {
  return (
    <Suspense fallback={<LoadingTable />}>
      <UsersPageContent />
    </Suspense>
  );
}
