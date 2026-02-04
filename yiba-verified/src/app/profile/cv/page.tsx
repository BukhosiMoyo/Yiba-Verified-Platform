
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth"; // OR "@/lib/auth"?
import { authOptions } from "@/lib/auth"; // This path might be different, need to verify
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText, Edit, Eye } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
    title: "My CVs | Yiba Verified",
};

export default async function CVManagerPage() {
    // Auth Check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login?callbackUrl=/profile/cv");
    }

    const userId = session.user.userId; // Confirm if session.user.id exists or we need to map from email

    // Fetch CVs
    const cvs = await prisma.cvVersion.findMany({
        where: { user_id: userId },
        orderBy: { updated_at: "desc" },
        include: {
            profiles_using: { select: { is_public: true } }
        }
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">CV Management</h1>
                    <p className="text-slate-500 mt-1">Create and manage your resume versions.</p>
                </div>
                <Link href="/profile/cv/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create New CV
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cvs.map(cv => (
                    <Card key={cv.id} className="p-6 relative group border-slate-200">
                        <div className="absolute top-4 right-4 flex gap-2">
                            {cv.profiles_using.length > 0 && (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                    Active on Profile
                                </span>
                            )}
                        </div>
                        <div className="mb-4">
                            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3">
                                <FileText className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold text-lg">{cv.title}</h3>
                            <p className="text-sm text-slate-500">
                                Updated {formatDistanceToNow(cv.updated_at, { addSuffix: true })}
                            </p>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Link href={`/profile/cv/${cv.id}`} className="flex-1">
                                <Button variant="outline" className="w-full gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            {cv.profiles_using.length > 0 && (
                                <Link href="/talent/me" className="flex-1">
                                    {/* /talent/me isn't implemented, used /talent/slug usually. 
                                        Maybe we store slug in session? Or fetch profile to get slug.
                                        For now disabled or just link to directory?
                                    */}
                                    <Button variant="ghost" className="w-full gap-2">
                                        <Eye className="h-4 w-4" />
                                        View
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </Card>
                ))}

                {cvs.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <h3 className="text-lg font-medium text-slate-900">No CVs yet</h3>
                        <p className="text-slate-500 mt-1 mb-6">Create your first CV to start applying for jobs.</p>
                        <Link href="/profile/cv/new">
                            <Button>Create Your First CV</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
