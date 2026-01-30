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
  MapPin,
  Phone,
  User,
  Hash,
  Layers,
  GraduationCap,
  Users,
  LayoutDashboard,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { CreateDocumentRequestForm } from "@/components/qcto/CreateDocumentRequestForm";
import { CreateFacilitatorRequestForm } from "@/components/qcto/CreateFacilitatorRequestForm";
import { CreateLearnerRequestForm } from "@/components/qcto/CreateLearnerRequestForm";
import { CreateAssessmentRequestForm } from "@/components/qcto/CreateAssessmentRequestForm";
import { BulkDataRequestForm } from "@/components/qcto/BulkDataRequestForm";

const STATUS_CONFIG: Record<
  string,
  { pattern: string; gradient: string; gradientTop: string; badge: string; iconBg: string; iconColor: string }
> = {
  APPROVED: {
    pattern: "institution-status-pattern--approved",
    gradient: "bg-gradient-to-b from-emerald-50/70 to-white dark:from-emerald-950/30 dark:to-card",
    gradientTop: "before:from-emerald-50/30 dark:before:from-emerald-950/20",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  PENDING: {
    pattern: "institution-status-pattern--pending",
    gradient: "bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-950/30 dark:to-card",
    gradientTop: "before:from-amber-50/30 dark:before:from-amber-950/20",
    badge: "bg-amber-100 text-amber-800 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  REJECTED: {
    pattern: "institution-status-pattern--rejected",
    gradient: "bg-gradient-to-b from-red-50/70 to-white dark:from-red-950/30 dark:to-card",
    gradientTop: "before:from-red-50/30 dark:before:from-red-950/20",
    badge: "bg-red-100 text-red-800 border-red-200/60 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60",
    iconBg: "bg-red-50 dark:bg-red-950/50",
    iconColor: "text-red-600 dark:text-red-400",
  },
  DRAFT: {
    pattern: "institution-status-pattern--draft",
    gradient: "bg-gradient-to-b from-slate-50/70 to-white dark:from-slate-900/30 dark:to-card",
    gradientTop: "before:from-slate-50/30 dark:before:from-slate-900/20",
    badge: "bg-slate-100 text-slate-800 border-slate-200/60 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/60",
    iconBg: "bg-slate-50 dark:bg-slate-800/50",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
  SUSPENDED: {
    pattern: "institution-status-pattern--suspended",
    gradient: "bg-gradient-to-b from-orange-50/70 to-white dark:from-orange-950/30 dark:to-card",
    gradientTop: "before:from-orange-50/30 dark:before:from-orange-950/20",
    badge: "bg-orange-100 text-orange-800 border-orange-200/60 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800/60",
    iconBg: "bg-orange-50 dark:bg-orange-950/50",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
};
const DEFAULT_STATUS = {
  pattern: "institution-status-pattern--default",
  gradient: "bg-gradient-to-b from-muted/60 to-card",
  gradientTop: "before:from-muted/25",
  badge: "bg-muted text-muted-foreground border-border",
  iconBg: "bg-muted",
  iconColor: "text-muted-foreground",
};
function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || DEFAULT_STATUS;
}

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
    const labels: Record<string, string> = {
      APPROVED: "Approved",
      PENDING: "Pending",
      REJECTED: "Rejected",
      DRAFT: "Draft",
      SUSPENDED: "Suspended",
    };
    const cfg = getStatusConfig(status);
    return <Badge className={`${cfg.badge} border font-semibold`}>{labels[status] || status}</Badge>;
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

  const cfg = getStatusConfig(institution.status);

  return (
    <div
      className={`relative space-y-6 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-0 before:h-64 before:bg-gradient-to-b before:to-transparent ${cfg.gradientTop}`}
    >
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="relative z-10 -ml-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-2" aria-hidden />
        Back
      </Button>

      {/* Hero: dots + status-themed gradient */}
      <section
        className={`institution-status-pattern ${cfg.pattern} ${cfg.gradient} relative z-10 rounded-2xl border border-gray-200/70 px-6 py-5`}
      >
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} ${cfg.iconColor}`}>
              <Building2 className="h-6 w-6" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{institution.trading_name || institution.legal_name}</h1>
              <p className="text-gray-600 mt-1">Comprehensive institution overview</p>
              <div className="mt-3">{getStatusBadge(institution.status)}</div>
            </div>
          </div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="relative z-10 space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Overview
          </TabsTrigger>
          <TabsTrigger value="accreditation" className="gap-2">
            <Award className="h-4 w-4" aria-hidden />
            Readiness ({institution._count?.readinessRecords || 0})
          </TabsTrigger>
          <TabsTrigger value="qcto" className="gap-2">
            <MessageSquare className="h-4 w-4" aria-hidden />
            QCTO ({institution._count?.qctoRequests || 0})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2">
            <FileText className="h-4 w-4" aria-hidden />
            Submissions ({institution._count?.submissions || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden border border-gray-200/60">
              <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Building2 className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Legal Name</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                    <Building2 className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    {institution.legal_name}
                  </p>
                </div>
                {institution.trading_name && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Trading Name</p>
                    <p className="mt-1 text-sm text-gray-900">{institution.trading_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Registration Number</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-mono text-gray-900">
                    <Hash className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    {institution.registration_number}
                  </p>
                </div>
                {institution.tax_compliance_pin && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tax Compliance PIN</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-mono text-gray-900">
                      <Hash className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                      {institution.tax_compliance_pin}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {institution.institution_type === "EMPLOYER" ? "Organisation Type" : "Institution Type"}
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {institution.institution_type === "EMPLOYER" ? "Company" : institution.institution_type}
                  </p>
                </div>
                {(institution.offers_workplace_based_learning === true || institution.offers_web_based_learning === true) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Delivery</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {[
                        institution.offers_workplace_based_learning === true && "Workplace-based learning",
                        institution.offers_web_based_learning === true && "Web-based (online) learning",
                      ].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Province</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                    <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    {institution.province}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-gray-200/60">
              <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Mail className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {institution.contact_person_name && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact Person</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                      <User className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                      {institution.contact_person_name}
                    </p>
                  </div>
                )}
                {institution.contact_email && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
                    <a
                      href={`mailto:${institution.contact_email}`}
                      className="mt-1 flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Mail className="h-4 w-4 shrink-0" aria-hidden />
                      {institution.contact_email}
                    </a>
                  </div>
                )}
                {institution.contact_number && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
                    <a
                      href={`tel:${institution.contact_number}`}
                      className="mt-1 flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Phone className="h-4 w-4 shrink-0" aria-hidden />
                      {institution.contact_number}
                    </a>
                  </div>
                )}
                {institution.physical_address && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Physical Address</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                      {institution.physical_address}
                    </p>
                  </div>
                )}
                {institution.postal_address && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Postal Address</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                      {institution.postal_address}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {institution.delivery_modes && institution.delivery_modes.length > 0 && (
              <Card className="overflow-hidden border border-gray-200/60">
                <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <Layers className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    Delivery Modes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {institution.delivery_modes.map((mode: string) => (
                      <Badge key={mode} variant="outline" className="font-medium">
                        {mode.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden border border-gray-200/60">
              <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <FileCheck className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <Users className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">Users</p>
                      <p className="text-lg font-bold text-gray-900">{institution._count?.users ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <ClipboardList className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">Enrolments</p>
                      <p className="text-lg font-bold text-gray-900">{institution._count?.enrolments ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <GraduationCap className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">Learners</p>
                      <p className="text-lg font-bold text-gray-900">{institution._count?.learners ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Award className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">Readiness</p>
                      <p className="text-lg font-bold text-gray-900">{institution._count?.readinessRecords ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <FileText className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">Submissions</p>
                      <p className="text-lg font-bold text-gray-900">{institution._count?.submissions ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <MessageSquare className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">QCTO Requests</p>
                      <p className="text-lg font-bold text-gray-900">{institution._count?.qctoRequests ?? 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accreditation" className="space-y-6">
          <Card className="overflow-hidden border border-gray-200/60">
            <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Award className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
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
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/qcto/readiness/${record.readiness_id}`} className="gap-1.5">
                                <Eye className="h-3.5 w-3.5" aria-hidden />
                                View
                              </Link>
                            </Button>
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
          {/* Request Actions */}
          <Card className="overflow-hidden border border-gray-200/60">
            <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <FileText className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                Request Data
              </CardTitle>
              <CardDescription>
                Create requests to access institution resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Request Specific Data Types</p>
                  <div className="flex flex-wrap gap-3">
                    <CreateFacilitatorRequestForm
                      institutionId={institution.institution_id}
                      onSuccess={() => {
                        window.location.reload();
                      }}
                    />
                    <CreateLearnerRequestForm
                      institutionId={institution.institution_id}
                      onSuccess={() => {
                        window.location.reload();
                      }}
                    />
                    <CreateAssessmentRequestForm
                      institutionId={institution.institution_id}
                      onSuccess={() => {
                        window.location.reload();
                      }}
                    />
                    <CreateDocumentRequestForm
                      institutionId={institution.institution_id}
                      institutionName={institution.trading_name || institution.legal_name}
                      onSuccess={() => {
                        window.location.reload();
                      }}
                    />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Bulk Data Request</p>
                  <BulkDataRequestForm
                    institutionId={institution.institution_id}
                    onSuccess={() => {
                      window.location.reload();
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-gray-200/60">
            <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <MessageSquare className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
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
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/qcto/requests/${request.request_id}`} className="gap-1.5">
                                <Eye className="h-3.5 w-3.5" aria-hidden />
                                View
                              </Link>
                            </Button>
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
          <Card className="overflow-hidden border border-gray-200/60">
            <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <FileText className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
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
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/qcto/submissions/${submission.submission_id}`} className="gap-1.5">
                                <Eye className="h-3.5 w-3.5" aria-hidden />
                                View
                              </Link>
                            </Button>
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
