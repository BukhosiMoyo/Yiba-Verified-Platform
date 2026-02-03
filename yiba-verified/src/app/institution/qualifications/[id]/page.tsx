"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface QualificationDetails {
    qualification_id: string;
    name: string;
    code: string | null;
    saqa_id: string | null;
    curriculum_code: string | null;
    type: string | null;
    nqf_level: number | null;
    status: string;
    summary: string | null;
    credits: number | null;
    occupational_category: string | null;
    updated_at: string;
}

export default function QualificationDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [data, setData] = useState<QualificationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [applying, setApplying] = useState(false);
    const [applyOpen, setApplyOpen] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState<string>("ON_SITE");
    const [alreadyApplied, setAlreadyApplied] = useState(false); // Can't easily check unless we fetch readiness too.
    // Actually the GET API checks if non-active.
    // We can try to fetch readiness list to see if already applied.

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                // resolve params promise in Next.js 15? No, params is just object in this version/setup usually.
                // Assuming params is plain object based on previous usage.
                const id = await Promise.resolve(params).then(p => p.id);

                const [qualRes, readRes] = await Promise.all([
                    fetch(`/api/institutions/qualifications/${id}`),
                    fetch(`/api/institutions/readiness?qualification_id=${id}`) // Check if existing application
                ]);

                if (!qualRes.ok) throw new Error("Failed to load qualification");
                const qualData = await qualRes.json();
                setData(qualData);

                if (readRes.ok) {
                    const readData = await readRes.json();
                    if (readData.items && readData.items.length > 0) {
                        setAlreadyApplied(true);
                    }
                }

            } catch (err: any) {
                setError(err.message || "Failed to load details");
            } finally {
                setLoading(false);
            }
        })();
    }, [params]);

    const handleApply = async () => {
        if (!data) return;
        try {
            setApplying(true);
            const res = await fetch("/api/institutions/readiness", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    qualification_id: data.qualification_id,
                    delivery_mode: deliveryMode,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to apply");
            }

            const readiness = await res.json();
            toast.success("Application started successfully!");
            setApplyOpen(false);
            router.push(`/institution/readiness/${readiness.readiness_id}`);
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return <div className="p-8 max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-48 w-full" />
        </div>;
    }

    if (error || !data) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center">
                <h2 className="text-xl font-semibold mb-2">Error loading qualification</h2>
                <p className="text-muted-foreground mb-4">{error || "Not found"}</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/institution/qualifications"><ChevronLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{data.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                        {data.code && <Badge variant="outline">{data.code}</Badge>}
                        <span>{data.type?.replace(/_/g, " ")}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-medium mb-1">Summary</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {data.summary || "No summary available."}
                                </p>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">SAQA ID</span>
                                    <div className="font-mono">{data.saqa_id || "—"}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Curriculum Code</span>
                                    <div className="font-mono">{data.curriculum_code || "—"}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">NQF Level</span>
                                    <div>{data.nqf_level || "—"}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Credits</span>
                                    <div>{data.credits || "—"}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Action</CardTitle>
                            <CardDescription>Start the process to offer this qualification.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {alreadyApplied ? (
                                <Alert className="bg-muted border-primary/20">
                                    <GraduationCap className="h-4 w-4" />
                                    <AlertTitle>Applied</AlertTitle>
                                    <AlertDescription>Your institution has already started the application for this qualification.</AlertDescription>
                                </Alert>
                            ) : (
                                <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full" size="lg">Apply to Offer</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Apply to Offer Qualification</DialogTitle>
                                            <DialogDescription>Select your delivery mode to begin the readiness process (Form 5).</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Qualification</Label>
                                                <div className="font-medium">{data.name}</div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Delivery Mode</Label>
                                                <Select value={deliveryMode} onValueChange={setDeliveryMode}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ON_SITE">Physical / Contact</SelectItem>
                                                        <SelectItem value="ONLINE">Online</SelectItem>
                                                        <SelectItem value="HYBRID">Hybrid / Blended</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
                                            <Button onClick={handleApply} disabled={applying}>
                                                {applying ? "Creating..." : "Start Application"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardContent>
                        {alreadyApplied && (
                            <CardFooter>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/institution/readiness">View My Applications</Link>
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
