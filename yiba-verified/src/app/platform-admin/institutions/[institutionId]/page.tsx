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
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  Users,
  GraduationCap,
  ClipboardList,
  FileCheck,
  Edit,
  Award,
  MessageSquare,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { InstitutionLearnersTable } from "@/components/platform-admin/InstitutionLearnersTable";

export default function InstitutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.institutionId as string;
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    legal_name: "",
    trading_name: "",
    institution_type: "",
    registration_number: "",
    tax_compliance_pin: "",
    physical_address: "",
    postal_address: "",
    province: "",
    contact_person_name: "",
    contact_email: "",
    contact_number: "",
    status: "",
  });

  useEffect(() => {
    fetchInstitution();
  }, [institutionId]);

  const fetchInstitution = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/platform-admin/institutions/${institutionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch institution");
      }

      const data = await response.json();
      setInstitution(data.institution);
      
      // Pre-fill edit form
      if (data.institution) {
        setEditFormData({
          legal_name: data.institution.legal_name || "",
          trading_name: data.institution.trading_name || "",
          institution_type: data.institution.institution_type || "",
          registration_number: data.institution.registration_number || "",
          tax_compliance_pin: data.institution.tax_compliance_pin || "",
          physical_address: data.institution.physical_address || "",
          postal_address: data.institution.postal_address || "",
          province: data.institution.province || "",
          contact_person_name: data.institution.contact_person_name || "",
          contact_email: data.institution.contact_email || "",
          contact_number: data.institution.contact_number || "",
          status: data.institution.status || "",
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
      const response = await fetch(`/api/platform-admin/institutions/${institutionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update institution");
      }

      toast.success("Institution updated successfully");
      setEditModalOpen(false);
      fetchInstitution(); // Refresh the data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update institution");
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
      DRAFT: { label: "Draft", variant: "secondary" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" as const };
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getReadinessStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      APPROVED: { label: "Approved", variant: "default" },
      PENDING: { label: "Pending", variant: "secondary" },
      REJECTED: { label: "Rejected", variant: "destructive" },
      NOT_STARTED: { label: "Not Started", variant: "secondary" },
      IN_PROGRESS: { label: "In Progress", variant: "secondary" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" as const };
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingTable />
      </div>
    );
  }

  if (error || !institution) {
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
          title="Institution not found"
          description={error || "The institution you're looking for doesn't exist or has been deleted."}
          icon={<Building2 className="h-12 w-12 text-gray-400" />}
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
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {institution.trading_name || institution.legal_name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive Institution Overview
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(institution.status)}
          <Button onClick={() => setEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Institution
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learners">Learners ({institution._count?.learners || 0})</TabsTrigger>
          <TabsTrigger value="accreditation">Accreditation ({institution._count?.readinessRecords || 0})</TabsTrigger>
          <TabsTrigger value="qcto">QCTO ({institution._count?.qctoRequests || 0})</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({institution._count?.submissions || 0})</TabsTrigger>
          <TabsTrigger value="users">Users ({institution._count?.users || 0})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Legal Name</p>
                  <p className="text-sm text-gray-900 mt-1">{institution.legal_name}</p>
                </div>
                {institution.trading_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Trading Name</p>
                    <p className="text-sm text-gray-900 mt-1">{institution.trading_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Registration Number</p>
                  <p className="text-sm text-gray-900 font-mono mt-1">{institution.registration_number}</p>
                </div>
                {institution.tax_compliance_pin && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tax Compliance PIN</p>
                    <p className="text-sm text-gray-900 font-mono mt-1">{institution.tax_compliance_pin}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Institution Type</p>
                  <p className="text-sm text-gray-900 mt-1">{institution.institution_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Province</p>
                  <p className="text-sm text-gray-900 mt-1">{institution.province}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-500" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {institution.contact_person_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contact Person</p>
                    <p className="text-sm text-gray-900 mt-1">{institution.contact_person_name}</p>
                  </div>
                )}
                {institution.contact_email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <a
                      href={`mailto:${institution.contact_email}`}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1 block"
                    >
                      {institution.contact_email}
                    </a>
                  </div>
                )}
                {institution.contact_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <a
                      href={`tel:${institution.contact_number}`}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1 block"
                    >
                      {institution.contact_number}
                    </a>
                  </div>
                )}
                {institution.physical_address && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Physical Address</p>
                    <p className="text-sm text-gray-900 mt-1">{institution.physical_address}</p>
                  </div>
                )}
                {institution.postal_address && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Postal Address</p>
                    <p className="text-sm text-gray-900 mt-1">{institution.postal_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Modes */}
            {institution.delivery_modes && institution.delivery_modes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    Delivery Modes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {institution.delivery_modes.map((mode: string) => (
                      <Badge key={mode} variant="outline">
                        {mode.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-gray-500" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Users</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {institution._count?.users || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                      <GraduationCap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Learners</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {institution._count?.learners || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                      <ClipboardList className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Enrolments</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {institution._count?.enrolments || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Submissions</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {institution._count?.submissions || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learners Tab */}
        <TabsContent value="learners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-gray-500" />
                All Learners
              </CardTitle>
              <CardDescription>
                {institution._count?.learners || 0} learners registered with this institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstitutionLearnersTable institutionId={institutionId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accreditation Tab */}
        <TabsContent value="accreditation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-gray-500" />
                Accreditation & Readiness Records
              </CardTitle>
              <CardDescription>
                {institution._count?.readinessRecords || 0} readiness records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {institution.readinessRecords && institution.readinessRecords.length > 0 ? (
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Qualification</TableHead>
                        <TableHead>SAQA ID</TableHead>
                        <TableHead>NQF Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {institution.readinessRecords.map((record: any) => (
                        <TableRow key={record.readiness_id}>
                          <TableCell className="font-medium">
                            {record.qualification_title}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {record.saqa_id}
                          </TableCell>
                          <TableCell>NQF {record.nqf_level || "—"}</TableCell>
                          <TableCell>
                            {getReadinessStatusBadge(record.readiness_status)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {record.submission_date ? formatDate(record.submission_date) : "—"}
                          </TableCell>
                          <TableCell>
                            <Link href={`/platform-admin/readiness/${record.readiness_id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              ) : (
                <EmptyState
                  title="No readiness records"
                  description="No accreditation or readiness records have been submitted yet."
                  icon={<Award className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QCTO Interactions Tab */}
        <TabsContent value="qcto" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                QCTO Requests & Interactions
              </CardTitle>
              <CardDescription>
                {institution._count?.qctoRequests || 0} QCTO requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {institution.qctoRequests && institution.qctoRequests.length > 0 ? (
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {institution.qctoRequests.map((request: any) => (
                        <TableRow key={request.request_id}>
                          <TableCell className="font-medium">
                            {request.request_type?.replace(/_/g, " ") || "—"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(request.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(request.updated_at)}
                          </TableCell>
                          <TableCell>
                            <Link href={`/platform-admin/qcto-requests/${request.request_id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              ) : (
                <EmptyState
                  title="No QCTO requests"
                  description="No QCTO requests or interactions have been recorded yet."
                  icon={<MessageSquare className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Submissions
              </CardTitle>
              <CardDescription>
                {institution._count?.submissions || 0} total submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {institution.submissions && institution.submissions.length > 0 ? (
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submission ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {institution.submissions.map((submission: any) => (
                        <TableRow key={submission.submission_id}>
                          <TableCell className="font-mono text-sm">
                            {submission.submission_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(submission.status)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {submission.submitted_at ? formatDate(submission.submitted_at) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(submission.created_at)}
                          </TableCell>
                          <TableCell>
                            <Link href={`/platform-admin/submissions/${submission.submission_id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              ) : (
                <EmptyState
                  title="No submissions"
                  description="No submissions have been made by this institution yet."
                  icon={<FileText className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                Institution Users
              </CardTitle>
              <CardDescription>
                {institution._count?.users || 0} users associated with this institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {institution.users && institution.users.length > 0 ? (
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {institution.users.map((user: any) => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.role.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell>
                            <Link href={`/platform-admin/users?institution_id=${institutionId}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              ) : (
                <EmptyState
                  title="No users found"
                  description="No users are currently associated with this institution."
                  icon={<Users className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Institution Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Institution</DialogTitle>
              <DialogDescription>
                Update institution information and settings
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legal_name">Legal Name *</Label>
                  <Input
                    id="legal_name"
                    value={editFormData.legal_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, legal_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trading_name">Trading Name</Label>
                  <Input
                    id="trading_name"
                    value={editFormData.trading_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, trading_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registration Number *</Label>
                  <Input
                    id="registration_number"
                    value={editFormData.registration_number}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, registration_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_compliance_pin">Tax Compliance PIN</Label>
                  <Input
                    id="tax_compliance_pin"
                    value={editFormData.tax_compliance_pin}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, tax_compliance_pin: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="physical_address">Physical Address *</Label>
                <Textarea
                  id="physical_address"
                  value={editFormData.physical_address}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, physical_address: e.target.value })
                  }
                  required
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_address">Postal Address</Label>
                <Textarea
                  id="postal_address"
                  value={editFormData.postal_address}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, postal_address: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Input
                    id="province"
                    value={editFormData.province}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, province: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution_type">Institution Type *</Label>
                  <Select
                    id="institution_type"
                    value={editFormData.institution_type}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, institution_type: e.target.value })
                    }
                    required
                  >
                    <option value="">Select type</option>
                    <option value="PRIVATE">Private</option>
                    <option value="PUBLIC">Public</option>
                    <option value="NGO">NGO</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person_name">Contact Person</Label>
                  <Input
                    id="contact_person_name"
                    value={editFormData.contact_person_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, contact_person_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={editFormData.contact_email}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, contact_email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  type="tel"
                  value={editFormData.contact_number}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, contact_number: e.target.value })
                  }
                />
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
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
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
    </div>
  );
}
