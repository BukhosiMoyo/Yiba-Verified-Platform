"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Building2,
  FileText,
  MessageSquare,
  ClipboardCheck,
  Edit,
  Loader2,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
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
  });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/platform-admin/users/${userId}`);
      
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
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      const response = await fetch(`/api/platform-admin/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          ...editFormData,
        }),
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      APPROVED: { label: "Approved", variant: "default" },
      PENDING: { label: "Pending", variant: "secondary" },
      REJECTED: { label: "Rejected", variant: "destructive" },
      ACTIVE: { label: "Active", variant: "default" },
      INACTIVE: { label: "Inactive", variant: "secondary" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" as const };
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return "default";
      case "QCTO_USER":
        return "default";
      case "INSTITUTION_ADMIN":
        return "default";
      case "INSTITUTION_STAFF":
        return "secondary";
      case "STUDENT":
        return "outline";
      default:
        return "outline";
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
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <EmptyState
          title="User not found"
          description={error || "The user you're looking for doesn't exist or has been deleted."}
          icon={<User className="h-12 w-12 text-gray-400" />}
        />
      </div>
    );
  }

  const isQCTOUser = user.role === "QCTO_USER";
  const tabCounts = isQCTOUser
    ? {
        requests: user._count?.requestedQCTORequests || 0,
        reviews: user._count?.reviewedQCTORequests || 0,
        submissions: user._count?.reviewedSubmissions || 0,
        resources: user._count?.addedResources || 0,
      }
    : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isQCTOUser ? "QCTO User Profile & Activity" : "User Profile & Information"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {user.role.replace(/_/g, " ")}
          </Badge>
          {getStatusBadge(user.status)}
          <Button onClick={() => setEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={isQCTOUser ? "grid w-full grid-cols-5" : "grid w-full grid-cols-2"}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isQCTOUser && (
            <>
              <TabsTrigger value="requests">
                Requests ({tabCounts.requests})
              </TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({tabCounts.reviews})
              </TabsTrigger>
              <TabsTrigger value="submissions">
                Submissions ({tabCounts.submissions})
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
                  <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1">
                    {user.role.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  {getStatusBadge(user.status)}
                </div>
              </CardContent>
            </Card>

            {/* Institution & Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  {isQCTOUser ? "Activity Summary" : "Institution"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.institution ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Institution</p>
                      <Link
                        href={`/platform-admin/institutions/${user.institution_id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1 block"
                      >
                        {user.institution.trading_name || user.institution.legal_name}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Institution Status</p>
                      {getStatusBadge(user.institution.status)}
                    </div>
                  </>
                ) : isQCTOUser ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Requests Made</span>
                      <span className="text-lg font-semibold">{tabCounts.requests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reviews Completed</span>
                      <span className="text-lg font-semibold">{tabCounts.reviews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Submissions Reviewed</span>
                      <span className="text-lg font-semibold">{tabCounts.submissions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Resources Added</span>
                      <span className="text-lg font-semibold">{tabCounts.resources}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No institution assigned</p>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Created</p>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(user.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* QCTO Requests Tab */}
        {isQCTOUser && (
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-gray-500" />
                  QCTO Requests Made
                </CardTitle>
                <CardDescription>
                  {tabCounts.requests} requests sent to institutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.requestedQCTORequests && user.requestedQCTORequests.length > 0 ? (
                  <ResponsiveTable>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Institution</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.requestedQCTORequests.map((request: any) => (
                          <TableRow key={request.request_id}>
                            <TableCell className="font-medium">{request.title}</TableCell>
                            <TableCell>
                              <Link
                                href={`/platform-admin/institutions/${request.institution_id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {request.institution?.trading_name || request.institution?.legal_name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {request.request_type?.replace(/_/g, " ") || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(request.requested_at)}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ResponsiveTable>
                ) : (
                  <EmptyState
                    title="No requests"
                    description="This QCTO user has not made any requests yet."
                    icon={<Send className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* QCTO Reviews Tab */}
        {isQCTOUser && (
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gray-500" />
                  QCTO Requests Reviewed
                </CardTitle>
                <CardDescription>
                  {tabCounts.reviews} requests reviewed by institutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.reviewedQCTORequests && user.reviewedQCTORequests.length > 0 ? (
                  <ResponsiveTable>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Institution</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reviewed</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.reviewedQCTORequests.map((request: any) => (
                          <TableRow key={request.request_id}>
                            <TableCell className="font-medium">{request.title}</TableCell>
                            <TableCell>
                              <Link
                                href={`/platform-admin/institutions/${request.institution_id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {request.institution?.trading_name || request.institution?.legal_name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {request.request_type?.replace(/_/g, " ") || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {request.reviewed_at ? formatDate(request.reviewed_at) : "—"}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ResponsiveTable>
                ) : (
                  <EmptyState
                    title="No reviews"
                    description="No QCTO requests have been reviewed by this user yet."
                    icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Submissions Reviewed Tab */}
        {isQCTOUser && (
          <TabsContent value="submissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-gray-500" />
                  Submissions Reviewed
                </CardTitle>
                <CardDescription>
                  {tabCounts.submissions} submissions reviewed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.reviewedSubmissions && user.reviewedSubmissions.length > 0 ? (
                  <ResponsiveTable>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Submission ID</TableHead>
                          <TableHead>Institution</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Reviewed</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.reviewedSubmissions.map((submission: any) => (
                          <TableRow key={submission.submission_id}>
                            <TableCell className="font-mono text-sm">
                              {submission.submission_id.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/platform-admin/institutions/${submission.institution_id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {submission.institution?.trading_name || submission.institution?.legal_name}
                              </Link>
                            </TableCell>
                            <TableCell>{getStatusBadge(submission.status)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {submission.submitted_at ? formatDate(submission.submitted_at) : "—"}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {submission.reviewed_at ? formatDate(submission.reviewed_at) : "—"}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ResponsiveTable>
                ) : (
                  <EmptyState
                    title="No submissions reviewed"
                    description="This QCTO user has not reviewed any submissions yet."
                    icon={<ClipboardCheck className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isQCTOUser && user.addedResources && user.addedResources.length > 0 ? (
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource Type</TableHead>
                        <TableHead>Submission</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.addedResources.map((resource: any) => (
                        <TableRow key={resource.resource_id}>
                          <TableCell>
                            <Badge variant="outline">{resource.resource_type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {resource.submission?.submission_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {resource.submission?.institution?.trading_name ||
                              resource.submission?.institution?.legal_name ||
                              "—"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(resource.added_at)}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              ) : (
                <EmptyState
                  title="No recent activity"
                  description="No recent activity recorded for this user."
                  icon={<FileText className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                  <Label htmlFor="first_name">First Name *</Label>
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
                  <Label htmlFor="last_name">Last Name *</Label>
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
                <Label htmlFor="email">Email *</Label>
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
                  <Label htmlFor="role">Role *</Label>
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
                  <Label htmlFor="status">Status *</Label>
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
    </div>
  );
}
