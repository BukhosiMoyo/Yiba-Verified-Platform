
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { JobRequestStatus } from "@prisma/client";
import { Mail, ArrowRight, Archive } from "lucide-react";

export const metadata: Metadata = {
    title: "Opportunities Inbox | Yiba Verified",
};

export default async function OpportunitiesPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login?callbackUrl=/profile/opportunities");
    }

    const requests = await prisma.jobOpportunityRequest.findMany({
        where: {
            candidate_user_id: session.user.id,
            status: { in: [JobRequestStatus.VERIFIED_SENT, JobRequestStatus.VIEWED] }
        },
        orderBy: { created_at: "desc" }
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
                    <p className="text-slate-500 mt-1">Job opportunities from verified companies.</p>
                </div>
            </div>

            <div className="space-y-4 max-w-4xl">
                {requests.map(req => (
                    <Card key={req.id} className="p-6 transition-all hover:shadow-md border-l-4 border-l-blue-500">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{req.role_title}</h3>
                                    {req.status === "VERIFIED_SENT" && (
                                        <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>
                                    )}
                                </div>
                                <div className="text-slate-600 font-medium mb-1">
                                    {req.company_name}
                                </div>
                                <div className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                                    <span>{formatDistanceToNow(req.verified_at!, { addSuffix: true })}</span>
                                    <span>•</span>
                                    <span>{req.work_type}</span>
                                    <span>•</span>
                                    <span>{req.location}</span>
                                </div>
                                <p className="text-slate-700 bg-slate-50 p-4 rounded-md text-sm leading-relaxed mb-4">
                                    {req.message}
                                </p>
                                <div className="text-sm text-slate-500">
                                    Contact: <a href={`mailto:${req.company_email}`} className="text-blue-600 hover:underline">{req.company_email}</a>
                                    {req.company_website && (
                                        <span className="ml-3">
                                            Website: <a href={req.company_website} target="_blank" className="text-blue-600 hover:underline">{req.company_website}</a>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 justify-center border-l md:pl-6 border-slate-100">
                                <Button asChild>
                                    <a href={`mailto:${req.company_email}?subject=Re: ${req.role_title} at ${req.company_name}`}>
                                        Reply via Email
                                    </a>
                                </Button>
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {requests.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Mail className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No new opportunities</h3>
                        <p className="text-slate-500 mt-1">
                            When companies contact you, their requests will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
