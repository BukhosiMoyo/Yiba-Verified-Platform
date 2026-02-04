
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TalentContactVisibility } from "@prisma/client";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const profile = await prisma.publicTalentProfile.findUnique({
            where: {
                slug: slug,
                is_public: true, // Only show if public
            },
            include: {
                user: {
                    select: {
                        first_name: true,
                        last_name: true,
                        image: true,
                        email: true, // Select but filter conditionally below
                        phone: true, // Select but filter conditionally below
                    },
                },
                public_cv: {
                    select: {
                        title: true,
                        content_json: true,
                        pdf_url: true,
                        updated_at: true
                    }
                },
                _count: {
                    select: { likes: true }
                }
            },
        });

        if (!profile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        // Privacy Logic for Contact Info
        let email = null;
        let phone = null;

        if (profile.contact_visibility === TalentContactVisibility.PUBLIC) {
            email = profile.user.email;
            phone = profile.user.phone;
        }

        // Construct safe response
        const responseData = {
            id: profile.id,
            slug: profile.slug,
            headline: profile.headline,
            bio: profile.bio,
            avatar_url: profile.avatar_url || profile.user.image, // Fallback to user image
            banner_url: profile.banner_url,
            primary_location: profile.primary_location,
            work_type: profile.work_type,
            open_to_anywhere: profile.open_to_anywhere,
            contact_visibility: profile.contact_visibility,

            // User info (Safe)
            first_name: profile.user.first_name,
            last_name: profile.user.last_name,

            // Privileged info (Null unless PUBLIC)
            email,
            phone,

            // Related Data
            cv: profile.public_cv,
            likes_count: profile._count.likes,
            updated_at: profile.updated_at,
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Error fetching talent profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}
