"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { Inbox, Loader2, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";

const SERVICE_TYPES: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "ACCREDITATION_HELP", label: "Accreditation help" },
  { value: "ACCOUNTING_SERVICES", label: "Accounting services" },
  { value: "MARKETING_WEBSITES", label: "Websites & marketing" },
  { value: "GENERAL_INQUIRY", label: "General inquiry" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CLOSED", label: "Closed" },
];

function formatServiceType(type: string): string {
  return SERVICE_TYPES.find((t) => t.value === type)?.label ?? type;
}

function formatStatus(status: string): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

export function ServiceRequestsClient() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (serviceTypeFilter && serviceTypeFilter !== "all") params.set("service_type", serviceTypeFilter);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "50");
      params.set("offset", "0");
      const res = await fetch(`/api/platform-admin/service-requests?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load service requests");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [serviceTypeFilter, statusFilter]);

  const openDetail = (item: any) => {
    setSelectedItem(item);
    setSelectedId(item.id);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/platform-admin/service-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success("Status updated");
      setSelectedItem((prev: any) => (prev?.id === id ? { ...prev, status } : prev));
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Service requests
          </CardTitle>
          <CardDescription>
            Requests from the contact form (accreditation help, accounting, websites, etc.). Update status when you follow up.
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingTable rows={5} columns={5} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-10 w-10 text-muted-foreground" />}
              title="No service requests"
              description="When someone submits a request from the contact form, it will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatServiceType(r.service_type)}</TableCell>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${r.email}`} className="text-primary hover:underline">
                        {r.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "NEW" ? "default" : r.status === "CONTACTED" ? "secondary" : "outline"}>
                        {formatStatus(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openDetail(r)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && total > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {items.length} of {total}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Service request</DialogTitle>
            <DialogDescription>
              {selectedItem && formatServiceType(selectedItem.service_type)}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p>{selectedItem.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <a href={`mailto:${selectedItem.email}`} className="text-primary hover:underline flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {selectedItem.email}
                </a>
              </div>
              {selectedItem.organization && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organization</p>
                  <p className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {selectedItem.organization}
                  </p>
                </div>
              )}
              {selectedItem.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{selectedItem.phone}</p>
                </div>
              )}
              {selectedItem.message && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Message</p>
                  <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-2">{selectedItem.message}</p>
                </div>
              )}
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Update status</p>
                <div className="flex gap-2">
                  {(["NEW", "CONTACTED", "CLOSED"] as const).map((status) => (
                    <Button
                      key={status}
                      variant={selectedItem.status === status ? "default" : "outline"}
                      size="sm"
                      disabled={updatingStatus}
                      onClick={() => updateStatus(selectedItem.id, status)}
                    >
                      {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : formatStatus(status)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
