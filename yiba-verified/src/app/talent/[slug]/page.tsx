
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, FileText, CheckCircle } from "lucide-react";
import { JobRequestModal } from "./_components/JobRequestModal";
import { LikeButton } from "./_components/LikeButton";
import { TalentContactVisibility } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface PageProps {
    params: {
        slug: string;
    };
}

// Generate Metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const profile = await prisma.publicTalentProfile.findUnique({
        where: { slug: params.slug, is_public: true },
        include: { user: true }
    });

    if (!profile) {
        return { title: "Profile Not Found | Yiba Verified" };
    }

    const name = `${profile.user.first_name} ${profile.user.last_name}`;
    return {
        title: `${name} – ${profile.headline || "Verified Talent"} | Yiba Verified`,
        description: profile.bio || `View ${name}'s verified profile and qualifications.`,
    };
}

export default async function TalentProfilePage({ params }: PageProps) {
    const profile = await prisma.publicTalentProfile.findUnique({
        where: { slug: params.slug, is_public: true },
        include: {
            user: true, // Fetch user details
            public_cv: true, // Fetch CV content
            _count: {
                select: { likes: true }
            }
        }
    });

    if (!profile) {
        notFound();
    }

    // Check Like Status
    const session = await getServerSession(authOptions);
    let isLiked = false;
    if (session?.user) {
        const like = await prisma.talentLike.findUnique({
            where: {
                liked_profile_id_user_id: {
                    liked_profile_id: profile.id,
                    user_id: session.user.userId
                }
            }
        });
        isLiked = !!like;
    }

    const name = `${profile.user.first_name} ${profile.user.last_name}`;
    const isContactPublic = profile.contact_visibility === TalentContactVisibility.PUBLIC;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Banner */}
            <div className="h-48 md:h-64 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative overflow-hidden">
                {profile.banner_url && (
                    <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover opacity-80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            <div className="container mx-auto px-4 relative -mt-20 z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Section */}
                    <div className="flex-shrink-0">
                        <div className="h-40 w-40 rounded-full border-4 border-white dark:border-slate-950 bg-white dark:bg-slate-900 overflow-hidden shadow-xl">
                            {profile.avatar_url || profile.user.image ? (
                                <img
                                    src={profile.avatar_url || profile.user.image!}
                                    alt={name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-4xl font-bold text-slate-400">
                                    {profile.user.first_name[0]}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Header Info */}
                    <div className="flex-1 text-white md:pt-20 pt-4">
                        <div className="bg-slate-900/80 md:bg-transparent p-4 md:p-0 rounded-lg backdrop-blur-md md:backdrop-blur-none inline-block md:block w-full">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-white md:drop-shadow-md">{name}</h1>
                            <p className="text-lg text-slate-600 dark:text-slate-300 md:text-slate-200 md:font-medium mt-1">{profile.headline}</p>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500 dark:text-slate-400 md:text-slate-300">
                                {profile.primary_location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {profile.primary_location}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Joined {new Date(profile.created_at).getFullYear()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 md:pt-24 flex gap-3">
                        <JobRequestModal candidateName={profile.user.first_name} slug={profile.slug} />
                        <LikeButton
                            profileId={profile.id}
                            initialCount={profile._count.likes}
                            initialLiked={isLiked}
                            isLoggedIn={!!session?.user}
                        />
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 pb-20">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About */}
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About</h2>
                            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                                {profile.bio ? (
                                    <p className="whitespace-pre-line">{profile.bio}</p>
                                ) : (
                                    <p className="italic text-slate-400">No bio provided.</p>
                                )}
                            </div>
                        </section>

                        {/* CV Content (If available) */}
                        {profile.public_cv && profile.public_cv.content_json && (
                            <section>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Resume
                                </h2>
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                                    {/* Handle simple string content or structured object */}
                                    {typeof profile.public_cv.content_json === 'object' && (profile.public_cv.content_json as any).html ? (
                                        <div dangerouslySetInnerHTML={{ __html: (profile.public_cv.content_json as any).html }} className="prose dark:prose-invert max-w-none" />
                                    ) : (
                                        <p className="mb-4 text-slate-600 dark:text-slate-400">
                                            Detailed CV available.
                                        </p>
                                    )}

                                    {profile.public_cv.pdf_url && (
                                        <div className="mt-4">
                                            <Button variant="outline" asChild>
                                                <a href={profile.public_cv.pdf_url} target="_blank" rel="noopener noreferrer">
                                                    Download PDF
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Info (If public) */}
                        {isContactPublic && (
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Contact</h3>
                                <div className="space-y-3 text-sm">
                                    {profile.user.email && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <span className="font-medium">Email:</span>
                                            <a href={`mailto:${profile.user.email}`} className="text-primary hover:underline">{profile.user.email}</a>
                                        </div>
                                    )}
                                    {profile.user.phone && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <span className="font-medium">Phone:</span>
                                            {profile.user.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Availability */}
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Preferences</h3>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Work Type</span>
                                    <Badge variant="outline">{profile.work_type}</Badge>
                                </div>
                                {profile.open_to_anywhere && (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                                        <CheckCircle className="h-4 w-4" />
                                        Open to relocation
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
