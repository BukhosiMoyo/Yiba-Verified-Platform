"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { EmptyState } from "@/components/shared/EmptyState";
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
import { Select } from "@/components/ui/select";
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  Edit,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/rbac";
import { PROVINCES } from "@/lib/provinces";

const QCTO_ROLES = [
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
] as const;

function roleLabel(r: string): string {
  return r.replace(/^QCTO_/, "").replace(/_/g, " ");
}

function getRoleVariant(r: string): "default" | "secondary" | "outline" {
  if (r === "QCTO_SUPER_ADMIN" || r === "QCTO_ADMIN") return "default";
  return "secondary";
}

export default function QCTOTeamUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ userId: string; role: Role } | null>(null);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
    default_province: "",
  });
  
  // Password change state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchCurrentUser();
  }, [userId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setCurrentUser({
            userId: data.user.userId || data.user.id,
            role: data.user.role as Role,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/qcto/team/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch user");
      }

      const data = await response.json();
      setUser(data.user);
      
      // Pre-fill edit form
      if (data.user) {
        setEditFormData({
          first_name: data.user.first_name || "",
          last_name: data.user.last_name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          role: data.user.role || "",
          status: data.user.status || "",
          default_province: data.user.default_province || "",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = currentUser?.role === "QCTO_SUPER_ADMIN";

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error("Only QCTO Super Admin can edit user details");
      return;
    }

    try {
      setEditLoading(true);
      
      // Build update payload with only changed fields
      const updatePayload: Record<string, any> = {};
      
      if (editFormData.first_name !== (user.first_name || "")) {
        updatePayload.first_name = editFormData.first_name;
      }
      if (editFormData.last_name !== (user.last_name || "")) {
        updatePayload.last_name = editFormData.last_name;
      }
      if (editFormData.email !== (user.email || "")) {
        updatePayload.email = editFormData.email;
      }
      if (editFormData.phone !== (user.phone || "")) {
        updatePayload.phone = editFormData.phone;
      }
      if (editFormData.role !== (user.role || "")) {
        updatePayload.role = editFormData.role;
      }
      if (editFormData.status !== (user.status || "")) {
        updatePayload.status = editFormData.status;
      }
      if (editFormData.default_province !== (user.default_province || "")) {
        updatePayload.default_province = editFormData.default_province || null;
      }

      if (Object.keys(updatePayload).length === 0) {
        toast.info("No changes to save");
        setEditModalOpen(false);
        return;
      }

      const response = await fetch(`/api/qcto/team/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      toast.success("User updated successfully");
      setEditModalOpen(false);
      fetchUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error("Only QCTO Super Admin can change user passwords");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await fetch(`/api/qcto/team/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingTable />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => router.push("/qcto/team")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Team
        </Button>
        <EmptyState
          title="User not found"
          description={error || "The user you're looking for doesn't exist or has been deleted."}
          icon={<User className="h-12 w-12 text-gray-400" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/qcto/team")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              QCTO Team Member
            </p>
          </div>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setPasswordModalOpen(true)}
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button onClick={() => setEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </div>
        )}
      </div>

      {/* User Information Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-sm text-gray-900 mt-1">
                {user.first_name} {user.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <a
                href={`mailto:${user.email}`}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1 block"
              >
                {user.email}
              </a>
            </div>
            {user.phone && (
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <a
                  href={`tel:${user.phone}`}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1 block"
                >
                  {user.phone}
                </a>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Role</p>
              <Badge variant={getRoleVariant(user.role)} className="mt-1">
                {roleLabel(user.role)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"} className="mt-1">
                {user.status === "ACTIVE" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* QCTO Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-500" />
              QCTO Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.default_province && (
              <div>
                <p className="text-sm font-medium text-gray-500">Default Province</p>
                <p className="text-sm text-gray-900 mt-1">{user.default_province}</p>
              </div>
            )}
            {user.assigned_provinces && user.assigned_provinces.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Assigned Provinces</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.assigned_provinces.map((province: string) => (
                    <Badge key={province} variant="outline">
                      {province}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(user.created_at).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit User Modal */}
      {isSuperAdmin && (
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and settings
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    value={editFormData.first_name}
                    onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    value={editFormData.last_name}
                    onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_role">Role *</Label>
                  <Select
                    id="edit_role"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    required
                  >
                    {QCTO_ROLES.map((r) => (
                      <option key={r} value={r}>{roleLabel(r)}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status *</Label>
                  <Select
                    id="edit_status"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_default_province">Default Province</Label>
                <Select
                  id="edit_default_province"
                  value={editFormData.default_province}
                  onChange={(e) => setEditFormData({ ...editFormData, default_province: e.target.value })}
                >
                  <option value="">None</option>
                  {PROVINCES.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
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
      )}

      {/* Change Password Modal */}
      {isSuperAdmin && (
        <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Set a new password for {user.first_name} {user.last_name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password *</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setPasswordModalOpen(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={passwordLoading || newPassword !== confirmPassword}>
                  {passwordLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Change Password
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
