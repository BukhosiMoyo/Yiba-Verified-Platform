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
import {
  GraduationCap,
  ArrowLeft,
  User,
  Building2,
  FileText,
  Calendar,
  Edit,
  Mail,
  Phone,
  Loader2,
  BookOpen,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function LearnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = params.learnerId as string;
  const [learner, setLearner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    national_id: "",
    alternate_id: "",
    birth_date: "",
    gender_code: "",
    nationality_code: "",
    home_language_code: "",
    disability_status: "",
  });

  useEffect(() => {
    fetchLearner();
  }, [learnerId]);

  const fetchLearner = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/platform-admin/learners/${learnerId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch learner");
      }

      const data = await response.json();
      setLearner(data.learner);
      
      // Pre-fill edit form
      if (data.learner) {
        setEditFormData({
          first_name: data.learner.first_name || "",
          last_name: data.learner.last_name || "",
          national_id: data.learner.national_id || "",
          alternate_id: data.learner.alternate_id || "",
          birth_date: data.learner.birth_date ? new Date(data.learner.birth_date).toISOString().split('T')[0] : "",
          gender_code: data.learner.gender_code || "",
          nationality_code: data.learner.nationality_code || "",
          home_language_code: data.learner.home_language_code || "",
          disability_status: data.learner.disability_status || "",
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
      const response = await fetch(`/api/platform-admin/learners/${learnerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update learner");
      }

      toast.success("Learner updated successfully");
      setEditModalOpen(false);
      fetchLearner();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update learner");
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

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getEnrolmentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      ACTIVE: { label: "Active", variant: "default" },
      COMPLETED: { label: "Completed", variant: "default" },
      WITHDRAWN: { label: "Withdrawn", variant: "destructive" },
      SUSPENDED: { label: "Suspended", variant: "secondary" },
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

  if (error || !learner) {
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
          title="Learner not found"
          description={error || "The learner you're looking for doesn't exist or has been deleted."}
          icon={<GraduationCap className="h-12 w-12 text-gray-400" />}
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
              {learner.first_name} {learner.last_name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Learner Profile & Records
            </p>
          </div>
        </div>
        <Button onClick={() => setEditModalOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Learner
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrolments">Enrolments ({learner._count?.enrolments || 0})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({learner._count?.documents || 0})</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
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
                    {learner.first_name} {learner.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">National ID</p>
                  <p className="text-sm text-gray-900 font-mono mt-1">{learner.national_id}</p>
                </div>
                {learner.alternate_id && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Alternate ID</p>
                    <p className="text-sm text-gray-900 font-mono mt-1">{learner.alternate_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(learner.birth_date)} ({calculateAge(learner.birth_date)} years old)
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p className="text-sm text-gray-900 mt-1">{learner.gender_code || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Nationality</p>
                  <p className="text-sm text-gray-900 mt-1">{learner.nationality_code || "—"}</p>
                </div>
                {learner.home_language_code && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Home Language</p>
                    <p className="text-sm text-gray-900 mt-1">{learner.home_language_code}</p>
                  </div>
                )}
                {learner.disability_status && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Disability Status</p>
                    <p className="text-sm text-gray-900 mt-1">{learner.disability_status}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Institution & Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  Institution & Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {learner.institution && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Institution</p>
                    <Link
                      href={`/platform-admin/institutions/${learner.institution_id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1 block"
                    >
                      {learner.institution.trading_name || learner.institution.legal_name}
                    </Link>
                  </div>
                )}
                {learner.user && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Email</p>
                      <p className="text-sm text-gray-900 mt-1">{learner.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Status</p>
                      <Badge variant={learner.user.status === "ACTIVE" ? "default" : "secondary"}>
                        {learner.user.status}
                      </Badge>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">POPIA Consent</p>
                  <Badge variant={learner.popia_consent ? "default" : "secondary"}>
                    {learner.popia_consent ? "Consented" : "Not Consented"}
                  </Badge>
                </div>
                {learner.consent_date && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Consent Date</p>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(learner.consent_date)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enrolments Tab */}
        <TabsContent value="enrolments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gray-500" />
                Enrolments
              </CardTitle>
              <CardDescription>
                {learner._count?.enrolments || 0} total enrolments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learner.enrolments && learner.enrolments.length > 0 ? (
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Qualification</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Expected Completion</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {learner.enrolments.map((enrolment: any) => (
                        <TableRow key={enrolment.enrolment_id}>
                          <TableCell className="font-medium">
                            {enrolment.qualification_title}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(enrolment.start_date)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {enrolment.expected_completion_date
                              ? formatDate(enrolment.expected_completion_date)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {getEnrolmentStatusBadge(enrolment.enrolment_status)}
                          </TableCell>
                          <TableCell>
                            {enrolment.attendance_percentage
                              ? `${enrolment.attendance_percentage}%`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              ) : (
                <EmptyState
                  title="No enrolments"
                  description="This learner has not been enrolled in any qualifications yet."
                  icon={<BookOpen className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Documents
              </CardTitle>
              <CardDescription>
                {learner._count?.documents || 0} documents uploaded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learner.documents && learner.documents.length > 0 ? (
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {learner.documents.map((doc: any) => (
                        <TableRow key={doc.document_id}>
                          <TableCell>
                            <Badge variant="outline">{doc.document_type}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{doc.file_name}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(2)} KB` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={doc.status === "APPROVED" ? "default" : "secondary"}>
                              {doc.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(doc.uploaded_at)}
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
                  title="No documents"
                  description="No documents have been uploaded for this learner yet."
                  icon={<FileText className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {learner.user ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 mt-1">{learner.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <Badge variant="outline" className="mt-1">
                      {learner.user.role.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Status</p>
                    <Badge variant={learner.user.status === "ACTIVE" ? "default" : "secondary"} className="mt-1">
                      {learner.user.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Created</p>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(learner.user.created_at || learner.created_at)}</p>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No account linked"
                  description="This learner does not have a user account linked yet."
                  icon={<User className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Learner Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Learner</DialogTitle>
              <DialogDescription>
                Update learner information
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="national_id">National ID *</Label>
                  <Input
                    id="national_id"
                    value={editFormData.national_id}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, national_id: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternate_id">Alternate ID</Label>
                  <Input
                    id="alternate_id"
                    value={editFormData.alternate_id}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, alternate_id: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date of Birth *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={editFormData.birth_date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, birth_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender_code">Gender</Label>
                  <Input
                    id="gender_code"
                    value={editFormData.gender_code}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, gender_code: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality_code">Nationality</Label>
                  <Input
                    id="nationality_code"
                    value={editFormData.nationality_code}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, nationality_code: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="home_language_code">Home Language</Label>
                  <Input
                    id="home_language_code"
                    value={editFormData.home_language_code}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, home_language_code: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disability_status">Disability Status</Label>
                  <Input
                    id="disability_status"
                    value={editFormData.disability_status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, disability_status: e.target.value })
                    }
                  />
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
