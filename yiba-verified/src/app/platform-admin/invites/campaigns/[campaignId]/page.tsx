"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Play, Pause, Settings, RefreshCw, Search, Users, Send, Eye, CheckCircle, InfoIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PageProps {
    params: Promise<{ campaignId: string }>;
}

export default function CampaignDetailPage({ params }: PageProps) {
    const { campaignId } = use(params);
    const router = useRouter();
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchCampaign = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/platform-admin/campaigns/${campaignId}`);
            if (!res.ok) throw new Error("Campaign not found");
            const data = await res.json();
            setCampaign(data);
        } catch (err) {
            toast.error("Failed to load campaign");
            router.push("/platform-admin/invites");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaign();
    }, [campaignId]);

    const updateStatus = async (action: "START" | "PAUSE") => {
        try {
            const res = await fetch(`/api/platform-admin/campaigns/${campaignId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });
            if (!res.ok) throw new Error("Failed to update status");
            const updated = await res.json();
            setCampaign(updated);
            toast.success(`Campaign ${action === "START" ? "started" : "paused"}`);

            if (action === "START") {
                // Trigger sending immediately
                fetch("/api/platform-admin/campaigns/process-queue", { method: "POST" });
            }
        } catch (err) {
            toast.error("Action failed");
        }
    };

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [limit, setLimit] = useState(20);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Restored missing state variables
    const [recipients, setRecipients] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalRecipients, setTotalRecipients] = useState(0);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to page 1 on search change
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchRecipients = async () => {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                status: statusFilter,
                search: debouncedSearch
            });
            const res = await fetch(`/api/platform-admin/campaigns/${campaignId}/recipients?${queryParams}`);
            const data = await res.json();
            if (data.data) {
                setRecipients(data.data);
                setTotalRecipients(data.meta.total);
            }
        } catch (error) {
            console.error("Failed to fetch recipients", error);
        }
    };

    useEffect(() => {
        if (campaign) {
            fetchRecipients();
        }
    }, [campaign, page, limit, statusFilter, debouncedSearch]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!campaign) return null;

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "ACCEPTED": return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
            case "OPENED": return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200";
            case "SENT": return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
            case "FAILED": return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
            case "QUEUED": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200";
            default: return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/platform-admin/invites">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        {campaign.name}
                        <Badge variant={campaign.status === "SENDING" ? "default" : "outline"}>
                            {campaign.status}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground text-sm">Created on {new Date(campaign.created_at).toLocaleDateString()}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={() => { fetchCampaign(); fetchRecipients(); }} title="Refresh stats">
                        <RefreshCw className="h-4 w-4" /> Refesh
                    </Button>
                    {campaign.status === "DRAFT" || campaign.status === "PAUSED" ? (
                        <Button onClick={() => updateStatus("START")}>
                            <Play className="h-4 w-4 mr-2" /> Start Sending
                        </Button>
                    ) : campaign.status === "SENDING" ? (
                        <Button variant="secondary" onClick={() => updateStatus("PAUSE")}>
                            <Pause className="h-4 w-4 mr-2" /> Pause
                        </Button>
                    ) : null}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader className="mb-2">
                                <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                    <Settings className="h-4 w-4 text-blue-600" />
                                    Campaign Settings
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[13px]">
                                    Manage configuration and delivery preferences for <span className="font-medium text-foreground">{campaign.name}</span>.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-2">
                                {/* General Settings */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px bg-border flex-1" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center">General</span>
                                        <div className="h-px bg-border flex-1" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium text-foreground">Campaign Name</Label>
                                        <div className="relative">
                                            <Input id="name" value={campaign.name} disabled className="pl-9 h-11 bg-background border-input" />
                                            <div className="absolute left-3 top-3 text-muted-foreground">
                                                <div className="h-5 w-5 rounded-full border flex items-center justify-center text-[9px] uppercase font-bold text-muted-foreground">ID</div>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">Campaign names are unique identifiers and cannot be changed once created.</p>
                                    </div>
                                </div>

                                {/* Delivery Settings */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 pt-2">
                                        <div className="h-px bg-border flex-1" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center">Delivery</span>
                                        <div className="h-px bg-border flex-1" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="throttle" className="text-sm font-medium text-foreground">Sending Speed</Label>
                                            <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-500 hover:bg-gray-100 border-0 font-normal px-2">Coming Soon</Badge>
                                        </div>
                                        <Select disabled defaultValue="50">
                                            <SelectTrigger id="throttle" className="h-11 bg-background border-input">
                                                <SelectValue placeholder="Select limit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="50">Standard (50/hr)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium text-foreground">Email Template</Label>
                                            <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-500 hover:bg-gray-100 border-0 font-normal px-2">Standard</Badge>
                                        </div>
                                        <div className="rounded-lg border bg-background p-3 flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded bg-blue-50 flex items-center justify-center border border-blue-100">
                                                    <span className="text-xs font-bold text-blue-600">T</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-medium text-foreground">Invitation Default</span>
                                                    <span className="text-xs text-muted-foreground">Standard Layout</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground" disabled>Preview</Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Advanced Section */}
                                <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100">
                                    <div className="flex items-start gap-3">
                                        <InfoIcon className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-blue-900">Advanced Features</h4>
                                            <p className="text-[12px] text-blue-700 leading-relaxed text-pretty">
                                                We are actively working on scheduling, A/B testing, and custom domain configuration. These features will be available in the next update.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="mt-4 pt-4 border-t">
                                <DialogClose asChild>
                                    <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-0">Close Settings</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRecipients || campaign.sent_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sent</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaign.sent_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Opened</CardTitle>
                        <Eye className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{campaign.opened_count}</div>
                        <p className="text-xs text-muted-foreground">{campaign.sent_count > 0 ? Math.round(campaign.opened_count / campaign.sent_count * 100) : 0}% rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{campaign.accepted_count}</div>
                        <p className="text-xs text-muted-foreground">{campaign.sent_count > 0 ? Math.round(campaign.accepted_count / campaign.sent_count * 100) : 0}% rate</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    placeholder="Search users..."
                                    className="h-10 w-[300px] rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                className="h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="QUEUED">Queued</option>
                                <option value="SENT">Sent</option>
                                <option value="OPENED">Opened</option>
                                <option value="ACCEPTED">Accepted</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-card overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-muted/30">
                                    <TableHead className="w-[50px] pl-4">#</TableHead>
                                    <TableHead className="w-[30%] cursor-pointer hover:text-foreground transition-colors" onClick={() => toast.info("Sorting by Name coming soon")}>
                                        Member <span className="ml-1 text-[10px] text-muted-foreground">↕</span>
                                    </TableHead>
                                    <TableHead className="w-[25%]">Organization</TableHead>
                                    <TableHead className="w-[15%]">Role</TableHead>
                                    <TableHead className="w-[15%] cursor-pointer hover:text-foreground transition-colors" onClick={() => toast.info("Sorting by Status coming soon")}>
                                        Status <span className="ml-1 text-[10px] text-muted-foreground">↕</span>
                                    </TableHead>
                                    <TableHead className="text-right pr-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => toast.info("Sorting by Date coming soon")}>
                                        Activity <span className="ml-1 text-[10px] text-muted-foreground">↕</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recipients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            No recipients found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    recipients.map((invite, index) => (
                                        <TableRow key={invite.invite_id} className="group cursor-pointer hover:bg-muted/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 text-[13px]">
                                            <TableCell className="pl-4 font-medium text-muted-foreground">
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                        {invite.first_name?.[0]}{invite.last_name?.[0] || invite.email[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold text-foreground truncate">
                                                            {invite.first_name ? `${invite.first_name} ${invite.last_name}` : 'Unknown Name'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground truncate">{invite.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium truncate max-w-[200px]">{invite.organization_label || "-"}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-muted-foreground">Recipient</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={`
                                                        px-2.5 py-0.5 rounded-full text-[11px] font-medium border-0
                                                        ${invite.status === 'ACCEPTED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                                                        ${invite.status === 'OPENED' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : ''}
                                                        ${invite.status === 'SENT' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
                                                        ${invite.status === 'FAILED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : ''}
                                                        ${invite.status === 'QUEUED' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}
                                                    `}
                                                >
                                                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full inline-block
                                                        ${invite.status === 'ACCEPTED' ? 'bg-green-500' : ''}
                                                        ${invite.status === 'OPENED' ? 'bg-purple-500' : ''}
                                                        ${invite.status === 'SENT' ? 'bg-blue-500' : ''}
                                                        ${invite.status === 'FAILED' ? 'bg-red-500' : ''}
                                                        ${invite.status === 'QUEUED' ? 'bg-yellow-500' : ''}
                                                    `} />
                                                    {invite.status === 'SENT' ? 'In Progress' : (invite.status.charAt(0) + invite.status.slice(1).toLowerCase())}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-4 text-muted-foreground">
                                                {invite.sent_at ? new Date(invite.sent_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer Pagination */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Rows per page</span>
                            <select
                                className="h-8 w-16 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                {Math.min((page - 1) * limit + 1, totalRecipients)}-{Math.min(page * limit, totalRecipients)} of {totalRecipients}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <span className="sr-only">Previous</span>
                                    <span aria-hidden="true">&lsaquo;</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={page * limit >= totalRecipients}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    <span className="sr-only">Next</span>
                                    <span aria-hidden="true">&rsaquo;</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
