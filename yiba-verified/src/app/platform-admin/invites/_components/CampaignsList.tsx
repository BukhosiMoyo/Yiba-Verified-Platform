"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { Search, Loader2, Play, Pause, Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export function CampaignsList() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/platform-admin/campaigns?limit=50");
            const data = await res.json();
            setCampaigns(data.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const getStatusBadge = (status: string) => {
        const map: any = {
            DRAFT: "secondary",
            SENDING: "default", // Blue/Primary
            PAUSED: "warning", // Yellow?
            COMPLETED: "success", // Green?
            ARCHIVED: "outline"
        };
        // shadcn badge variants: default, secondary, destructive, outline.
        // We can map loosely.
        let variant = "outline";
        if (status === "SENDING") variant = "default";
        if (status === "COMPLETED") variant = "secondary";
        if (status === "PAUSED") variant = "destructive"; // Red isn't great for pause but distinguishing.

        return <Badge variant={variant as any}>{status}</Badge>;
    };

    const filtered = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search campaigns..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button variant="outline" onClick={fetchCampaigns}>
                    Refresh
                </Button>
            </div>

            <ResponsiveTable>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Campaign Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Audience</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Sent / Open / Accepted</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    Loading campaigns...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No campaigns found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(campaign => (
                                <TableRow key={campaign.campaign_id}>
                                    <TableCell className="font-medium">{campaign.name}</TableCell>
                                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                                    <TableCell className="text-muted-foreground">{campaign.audience_type}</TableCell>
                                    <TableCell>
                                        {/* Simple progress bar or text */}
                                        <div className="flex flex-col gap-1 w-24">
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                {/* We assume we know total? We can estimate from sent + queued if we had it. */}
                                                {/* For now, sent_count is sent. Total? We don't have total_recipients in Campaign model easily unless we count Invite. */}
                                                {/* Just show sent count */}
                                                <div className="h-full bg-primary" style={{ width: '10%' }}></div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-3 text-sm">
                                            <span title="Sent">{campaign.sent_count}</span>
                                            <span className="text-muted-foreground">/</span>
                                            <span title="Opened" className="text-blue-600">{campaign.opened_count}</span>
                                            <span className="text-muted-foreground">/</span>
                                            <span title="Accepted" className="text-green-600">{campaign.accepted_count}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/platform-admin/invites/campaigns/${campaign.campaign_id}`}>
                                                View
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </ResponsiveTable>
        </div>
    );
}
