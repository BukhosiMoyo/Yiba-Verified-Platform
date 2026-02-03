
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Briefcase, Globe } from "lucide-react";
import { WorkType } from "@prisma/client";

// Metadata
export const metadata: Metadata = {
    title: "Yiba Verified Talent Directory",
    description: "Browse verified student and professional CVs.",
};

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: {
        search?: string;
        location?: string;
        work_type?: string;
        page?: string;
    };
}

export default async function TalentDirectoryPage({ searchParams }: PageProps) {
    const page = parseInt(searchParams.page || "1");
    const pageSize = 20;
    const skip = (page - 1) * pageSize;
    const search = searchParams.search;
    const location = searchParams.location;
    const workType = searchParams.work_type;

    // Build Query
    const where: any = {
        is_public: true,
    };

    if (search) {
        where.OR = [
            { headline: { contains: search, mode: "insensitive" } },
            { bio: { contains: search, mode: "insensitive" } },
            {
                user: {
                    OR: [
                        { first_name: { contains: search, mode: "insensitive" } },
                        { last_name: { contains: search, mode: "insensitive" } },
                    ],
                },
            },
        ];
    }

    if (location) {
        where.primary_location = { contains: location, mode: "insensitive" };
    }

    if (workType && Object.values(WorkType).includes(workType as WorkType)) {
        where.work_type = workType as WorkType;
    }

    const [total, profiles] = await Promise.all([
        prisma.publicTalentProfile.count({ where }),
        prisma.publicTalentProfile.findMany({
            where,
            take: pageSize,
            skip,
            orderBy: { updated_at: "desc" },
            include: {
                user: { select: { first_name: true, last_name: true, image: true } },
            },
        }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Hero Section */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pb-12 pt-16">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                        Find Verified Talent
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                        Browse our directory of verified students and professionals ready for their next opportunity.
                    </p>

                    {/* Search Bar - Client Form */}
                    <form className="mt-8 flex flex-col md:flex-row gap-4 max-w-4xl" action="/talent">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                name="search"
                                defaultValue={search}
                                placeholder="Search by name, skills, or headline..."
                                className="pl-10 h-12 text-lg"
                            />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                name="location"
                                defaultValue={location}
                                placeholder="Location (e.g. Cape Town)"
                                className="pl-10 h-12 w-full md:w-64"
                            />
                        </div>
                        <div className="relative">
                            <select name="work_type" defaultValue={workType} className="h-12 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="">Any Work Type</option>
                                <option value="ONSITE">On-site</option>
                                <option value="REMOTE">Remote</option>
                                <option value="HYBRID">Hybrid</option>
                            </select>
                        </div>
                        <Button type="submit" size="lg" className="h-12 px-8">
                            Search
                        </Button>
                    </form>
                </div>
            </div>

            {/* Directory Grid */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {profiles.map((profile) => (
                        <Link key={profile.id} href={`/talent/${profile.slug}`}>
                            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50 group bg-white dark:bg-slate-900/50">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
                                                {profile.avatar_url || profile.user.image ? (
                                                    <img
                                                        src={profile.avatar_url || profile.user.image!}
                                                        alt="Avatar"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-slate-400 font-semibold text-lg">
                                                        {profile.user.first_name?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                    {profile.user.first_name} {profile.user.last_name}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                    {profile.primary_location || "No location set"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 h-10">
                                        {profile.headline || profile.bio || "No headline available"}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {/* Badges/Tags */}
                                        <Badge variant="secondary" className="text-xs">
                                            {profile.work_type === "ONSITE" && "On-site"}
                                            {profile.work_type === "REMOTE" && "Remote"}
                                            {profile.work_type === "HYBRID" && "Hybrid"}
                                        </Badge>
                                        {profile.open_to_anywhere && (
                                            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 dark:text-blue-400 dark:border-blue-900">
                                                Open to relocation
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Empty State */}
                {profiles.length === 0 && (
                    <div className="text-center py-20">
                        <div className="bg-slate-100 dark:bg-slate-900 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No talent found</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">
                            We couldn't find any profiles matching your search. Try adjusting your filters or search terms.
                        </p>
                        <Link href="/talent" className="mt-6 inline-block text-primary hover:underline">
                            Clear all filters
                        </Link>
                    </div>
                )}

                {/* Pagination - Simple */}
                {totalPages > 1 && (
                    <div className="mt-12 flex justify-center gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <Link
                                key={i}
                                href={{
                                    pathname: '/talent',
                                    query: { ...searchParams, page: (i + 1).toString() },
                                }}
                            >
                                <Button
                                    variant={i + 1 === page ? "default" : "outline"}
                                    size="sm"
                                >
                                    {i + 1}
                                </Button>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
