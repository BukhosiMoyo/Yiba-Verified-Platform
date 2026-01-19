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
  Building2,
  ArrowLeft,
  Mail,
  FileText,
  ClipboardList,
  FileCheck,
  Award,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function QCTOInstitutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.institutionId as string;
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchInstitution();
  }, [institutionId]);

  const fetchInstitution = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/qcto/institutions/${institutionId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch institution");
      }

      const data = await response.json();
      setInstitution(data.institution);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
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
      SUSPENDED: { label: "Suspended", variant: "secondary" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
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
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
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
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {institution.trading_name || institution.legal_name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Institution overview</p>
          </div>
        </div>
        {getStatusBadge(institution.status)}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accreditation">Readiness ({institution._count?.readinessRecords || 0})</TabsTrigger>
          <TabsTrigger value="qcto">QCTO Requests ({institution._count?.qctoRequests || 0})</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({institution._count?.submissions || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                      <ClipboardList className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Readiness</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {institution._count?.readinessRecords || 0}
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
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">QCTO Requests</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {institution._count?.qctoRequests || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accreditation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-gray-500" />
                Readiness Records
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
                          <TableCell className="font-medium">{record.qualification_title}</TableCell>
                          <TableCell className="font-mono text-sm">{record.saqa_id}</TableCell>
                          <TableCell>NQF {record.nqf_level || "—"}</TableCell>
                          <TableCell>{getReadinessStatusBadge(record.readiness_status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {record.submission_date ? formatDate(record.submission_date) : "—"}
                          </TableCell>
                          <TableCell>
                            <Link href={`/qcto/readiness/${record.readiness_id}`}>
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
                  description="No readiness records have been submitted yet."
                  icon={<Award className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qcto" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                QCTO Requests
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
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(request.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(request.updated_at)}
                          </TableCell>
                          <TableCell>
                            <Link href={`/qcto/requests/${request.request_id}`}>
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
                  description="No QCTO requests have been recorded yet."
                  icon={<MessageSquare className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {submission.submitted_at ? formatDate(submission.submitted_at) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(submission.created_at)}
                          </TableCell>
                          <TableCell>
                            <Link href={`/qcto/submissions/${submission.submission_id}`}>
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
      </Tabs>
    </div>
  );
}
