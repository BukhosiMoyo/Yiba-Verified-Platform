"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import Link from "next/link";
import { Users, Eye, Search, X, Building2, FileText, Shield, AlertTriangle, CheckCircle } from "lucide-react";

const PAGE_SIZE_KEY = "yv_table_page_size:qcto_facilitators";
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

function QctoFacilitatorsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [facilitators, setFacilitators] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [verificationFilter, setVerificationFilter] = useState(searchParams.get("verification_status") || "");
  const [certificationFilter, setCertificationFilter] = useState(searchParams.get("certification_status") || "");
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (ROWS_PER_PAGE_OPTIONS.includes(n as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
          setPageSizeState(n);
        }
      }
    } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => {
    const s = searchParams.get("search") || "";
    const v = searchParams.get("verification_status") || "";
    const c = searchParams.get("certification_status") || "";
    setSearchQuery(s);
    setVerificationFilter(v);
    setCertificationFilter(c);
    setOffset(0);
  }, [searchParams]);

  useEffect(() => {
    fetchFacilitators();
  }, [searchQuery, verificationFilter, certificationFilter, offset, pageSize]);

  const fetchFacilitators = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim().length >= 2) params.set("search", searchQuery.trim());
      if (verificationFilter) params.set("verification_status", verificationFilter);
      if (certificationFilter) params.set("certification_status", certificationFilter);
      params.set("limit", String(pageSize));
      params.set("offset", String(offset));

      const res = await fetch(`/api/qcto/facilitators?${params}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to fetch facilitators");
      }
      const data = await res.json();
      setFacilitators(data.items || []);
      setTotal(typeof data.count === "number" ? data.count : 0);
    } catch (e: any) {
      setError(e.message || "An error occurred");
      setFacilitators([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const pushURL = (q: string, v: string, c: string) => {
    const p = new URLSearchParams();
    if (q.trim().length >= 2) p.set("search", q.trim());
    if (v) p.set("verification_status", v);
    if (c) p.set("certification_status", c);
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const handleSearch = (v: string) => { setSearchQuery(v); setOffset(0); pushURL(v, verificationFilter, certificationFilter); };
  const handleVerificationFilter = (v: string) => { setVerificationFilter(v); setOffset(0); pushURL(searchQuery, v, certificationFilter); };
  const handleCertificationFilter = (v: string) => { setCertificationFilter(v); setOffset(0); pushURL(searchQuery, verificationFilter, v); };
  const clearFilters = () => { 
    setSearchQuery(""); 
    setVerificationFilter(""); 
    setCertificationFilter(""); 
    setOffset(0); 
    router.push("?", { scroll: false }); 
  };
  const handlePageSizeChange = (n: number) => {
    setPageSizeState(n);
    setOffset(0);
    try { localStorage.setItem(PAGE_SIZE_KEY, String(n)); } catch (_) { /* ignore */ }
  };

  const hasActiveFilters = searchQuery.trim().length >= 2 || verificationFilter || certificationFilter;

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-2">
            <Users className="h-6 w-6 md:h-8 md:w-8" />
            Facilitators
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            View facilitators from institutions you have access to
          </p>
        </div>
      </div>

      {/* Toolbar: search, filters, clear */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search facilitators..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={verificationFilter}
            onChange={(e) => handleVerificationFilter(e.target.value)}
            className="w-[180px]"
          >
            <option value="">All Verification Status</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </Select>
          <Select
            value={certificationFilter}
            onChange={(e) => handleCertificationFilter(e.target.value)}
            className="w-[200px]"
          >
            <option value="">All Certifications</option>
            <option value="VALID">Valid Certifications</option>
            <option value="EXPIRING_SOON">Expiring Soon (30 days)</option>
            <option value="EXPIRED">Expired Certifications</option>
            <option value="NONE">No Certifications</option>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">All Facilitators</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} facilitator${total !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {error && (
          <div className="py-4 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        {loading ? (
          <LoadingTable columns={7} rows={6} />
        ) : facilitators.length === 0 ? (
          <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 overflow-x-auto bg-white dark:bg-gray-900/50">
            <div className="py-12">
              <EmptyState
                title={hasActiveFilters ? "No facilitators found" : "No facilitators yet"}
                description={
                  hasActiveFilters
                    ? "Try adjusting your search."
                    : "Facilitators will appear here when they are linked to readiness records you have access to."
                }
                icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
                variant={hasActiveFilters ? "no-results" : "default"}
              />
            </div>
          </div>
        ) : (
          <>
            <ResponsiveTable>
              <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 dark:[&_th]:border-gray-700 [&_td]:border [&_td]:border-gray-200 dark:[&_td]:border-gray-700">
                <TableHeader>
                  <TableRow className="bg-gray-50/40 dark:bg-gray-800/40 hover:bg-gray-50/40 dark:hover:bg-gray-800/40">
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap w-12">#</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">Name</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">ID Number</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">Institution</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">Qualification</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">Verification</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">Certifications</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">Documents</TableHead>
                    <TableHead className="sticky right-0 z-10 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilitators.map((f, index) => {
                    const inst = f.readiness?.institution;
                    return (
                      <TableRow key={f.facilitator_id} className="group hover:bg-sky-50/50 dark:hover:bg-sky-900/20 transition-colors duration-200">
                        <TableCell className="py-3 whitespace-nowrap text-gray-800 dark:text-gray-200 w-12 font-bold">{offset + index + 1}</TableCell>
                        <TableCell className="font-medium py-3 whitespace-nowrap">
                          {f.first_name} {f.last_name}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap font-mono text-sm">{f.id_number || "—"}</TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            {inst?.trading_name || inst?.legal_name || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 max-w-[200px] truncate" title={f.readiness?.qualification_title || "—"}>
                          {f.readiness?.qualification_title || "—"}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          {f.verification_status === "VERIFIED" && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {f.verification_status === "PENDING" && (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {f.verification_status === "REJECTED" && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-xs">
                              <X className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                          {!f.verification_status && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          {(() => {
                            const certs = f.certifications || [];
                            if (certs.length === 0) return <span className="text-xs text-muted-foreground">None</span>;
                            
                            const now = new Date();
                            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                            const validCerts = certs.filter((c: any) => !c.expiry_date || new Date(c.expiry_date) > now);
                            const expiringSoon = certs.filter((c: any) => {
                              if (!c.expiry_date) return false;
                              const expiry = new Date(c.expiry_date);
                              return expiry > now && expiry <= thirtyDaysFromNow;
                            });
                            const expired = certs.filter((c: any) => c.expiry_date && new Date(c.expiry_date) <= now);
                            
                            if (expired.length > 0) {
                              return (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {expired.length} Expired
                                </Badge>
                              );
                            }
                            if (expiringSoon.length > 0) {
                              return (
                                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {expiringSoon.length} Expiring
                                </Badge>
                              );
                            }
                            return (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {validCerts.length} Valid
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            {f.documents?.length || 0}
                          </div>
                        </TableCell>
                        <TableCell className="sticky right-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-sky-50/50 dark:group-hover:bg-sky-900/20 border-l border-gray-200 dark:border-gray-700 py-3 whitespace-nowrap">
                          <Button variant="outline" size="sm" asChild className="h-6 min-w-0 px-1.5 text-[11px] gap-1 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500">
                            <Link href={`/qcto/facilitators/${f.facilitator_id}`}>
                              <Eye className="h-3 w-3" aria-hidden />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ResponsiveTable>

            {/* Footer: Rows per page + pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Rows per page</span>
                <Select
                  value={String(pageSize)}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                  className="w-[70px]"
                >
                  {ROWS_PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
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
          </>
        )}
      </div>
    </div>
  );
}

export default function QCTOFacilitatorsPage() {
  return (
    <Suspense fallback={<LoadingTable columns={7} rows={6} />}>
      <QctoFacilitatorsContent />
    </Suspense>
  );
}
