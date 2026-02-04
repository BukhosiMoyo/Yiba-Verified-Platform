"use client";

import { useState, useEffect } from "react";
import { Eye, X, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";
import type { Role } from "@/lib/rbac";

type ViewAsUserBannerProps = {
  viewingAsUserId: string;
  viewingAsRole: Role;
  viewingAsUserName: string;
  originalUserName: string;
  originalRole: Role;
  onStop: () => void;
};

type ViewAsUserSelectorProps = {
  currentRole: Role;
  onStart: (userId: string) => void;
};

const roleLabels: Record<Role, string> = {
  PLATFORM_ADMIN: "Platform Admin",
  QCTO_USER: "QCTO User",
  QCTO_SUPER_ADMIN: "QCTO Super Admin",
  QCTO_ADMIN: "QCTO Admin",
  QCTO_REVIEWER: "QCTO Reviewer",
  QCTO_AUDITOR: "QCTO Auditor",
  QCTO_VIEWER: "QCTO Viewer",
  INSTITUTION_ADMIN: "Institution Admin",
  INSTITUTION_STAFF: "Institution Staff",
  STUDENT: "Student",
  ADVISOR: "Advisor",
  FACILITATOR: "Facilitator",
};

/**
 * Banner shown when viewing as another user
 */
export function ViewAsUserBanner({
  viewingAsUserId,
  viewingAsRole,
  viewingAsUserName,
  originalUserName,
  originalRole,
  onStop,
}: ViewAsUserBannerProps) {
  return (
    <Alert
      variant="warning"
      icon={<Eye className="h-4 w-4 text-amber-600 dark:text-amber-500" />}
      description={
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-900 dark:text-amber-100">
              Viewing as:
            </span>
            <span className="text-amber-800 dark:text-amber-200">
              {viewingAsUserName} ({roleLabels[viewingAsRole]})
            </span>
            <span className="text-amber-600 dark:text-amber-400 text-sm">
              (You are {originalUserName}, {roleLabels[originalRole]})
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            className="border-amber-500/50 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/30"
          >
            <X className="h-3 w-3 mr-1" />
            Stop Viewing As
          </Button>
        </div>
      }
      className="mb-4"
    />
  );
}

/**
 * Dropdown selector to start viewing as another user
 */
export function ViewAsUserSelector({ currentRole, onStart }: ViewAsUserSelectorProps) {
  const [users, setUsers] = useState<
    Array<{
      user_id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: Role;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Check if user can view as others
  const canViewAsRoles = [
    "PLATFORM_ADMIN",
    "QCTO_SUPER_ADMIN",
    "QCTO_ADMIN",
    "INSTITUTION_ADMIN",
  ];

  if (!canViewAsRoles.includes(currentRole)) {
    return null; // Don't show if user can't view as others
  }

  useEffect(() => {
    if (open && users.length === 0) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/view-as/users");
      if (!response.ok) {
        throw new Error("Failed to load users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to load viewable users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    try {
      const response = await fetch("/api/view-as/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start viewing as user");
      }

      toast.success("Now viewing as user");
      setOpen(false);
      // Reload page to apply View As context
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to start viewing as user:", error);
      toast.error(error.message || "Failed to start viewing as user");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-xs"
          title="View as another user"
        >
          <Eye className="h-3 w-3" />
          <span className="hidden sm:inline">View As</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>View As User</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <DropdownMenuItem disabled>Loading users...</DropdownMenuItem>
        ) : users.length === 0 ? (
          <DropdownMenuItem disabled>No users available</DropdownMenuItem>
        ) : (
          users.map((user) => (
            <DropdownMenuItem
              key={user.user_id}
              onClick={() => handleSelectUser(user.user_id)}
              className="flex flex-col items-start gap-1"
            >
              <div className="font-medium">
                {user.first_name} {user.last_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.email} • {roleLabels[user.role]}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
