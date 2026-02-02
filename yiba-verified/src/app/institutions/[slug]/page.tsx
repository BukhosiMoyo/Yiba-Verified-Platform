import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GradientShell } from "@/components/shared/Backgrounds";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Star, Mail, Phone, ExternalLink } from "lucide-react";
import { InstitutionProfileClient } from "./InstitutionProfileClient";

type Props = { params: Promise<{ slug: string }> };

async function getProfile(slug: string) {
  const profile = await prisma.institutionPublicProfile.findFirst({
    where: { slug, is_public: true },
    include: {
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
          province: true,
          physical_address: true,
          delivery_modes: true,
          status: true,
        },
      },
    },
  });
  if (!profile) return null;

  const [reviews, posts, qualifications, avgRating, reviewCount, compliance, contacts] = await Promise.all([
    prisma.institutionReview.findMany({
      where: { institution_id: profile.institution_id, status: "PUBLISHED" },
      select: { id: true, rating: true, comment: true, user_id: true, reviewer_name: true, created_at: true },
      orderBy: { created_at: "desc" },
      take: 20,
    }),
    prisma.institutionPost.findMany({
      where: { institution_id: profile.institution_id },
      orderBy: { created_at: "desc" },
      take: 20,
    }),
    prisma.readiness.findMany({
      where: { institution_id: profile.institution_id, deleted_at: null },
      select: { qualification_title: true, qualification_registry: { select: { name: true, nqf_level: true } } },
    }),
    prisma.institutionReview.aggregate({
      where: { institution_id: profile.institution_id, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.institutionReview.count({ where: { institution_id: profile.institution_id, status: "PUBLISHED" } }),
    prisma.institutionCompliance.findUnique({
      where: { institution_id: profile.institution_id },
      select: { accreditation_status: true, accreditation_number: true, expiry_date: true }
    }),
    prisma.institutionContact.findMany({
      where: { institution_id: profile.institution_id, visibility: "PUBLIC_OPTIONAL" },
      select: { first_name: true, last_name: true, email: true, phone_number: true, type: true }
    }),
  ]);

  return {
    profile,
    institution: profile.institution,
    reviews,
    posts,
    qualifications: qualifications.map((q) => ({
      title: q.qualification_registry?.name || q.qualification_title,
      nqf_level: q.qualification_registry?.nqf_level ?? null,
    })),
    rating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
    review_count: reviewCount,
    compliance,
    contacts,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProfile(slug);
  if (!data) return { title: "Institution Not Found" };
  const name = data.institution.trading_name || data.institution.legal_name;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";
  const description = data.profile.tagline || data.profile.about?.slice(0, 160) || `View ${name} on Yiba Verified.`;
  return {
    title: `${name} | Find an accredited institution`,
    description,
    openGraph: {
      title: `${name} | Yiba Verified`,
      description,
      type: "website",
      url: `${baseUrl}/institutions/${slug}`,
      images: data.profile.logo_url ? [{ url: data.profile.logo_url, alt: name }] : undefined,
    },
    twitter: { card: "summary_large_image", title: `${name} | Yiba Verified`, description },
  };
}

export const revalidate = 300;

export default async function InstitutionProfilePage({ params }: Props) {
  const { slug } = await params;
  const data = await getProfile(slug);
  if (!data) notFound();

  const { profile, institution, reviews, posts, qualifications, rating, review_count, compliance, contacts } = data;
  const profileForClient = {
    ...profile,
    cached_rating_avg: profile.cached_rating_avg != null ? Number(profile.cached_rating_avg) : null,
  };
  const name = institution.trading_name || institution.legal_name;
  const showContact = profile.contact_visibility === "PUBLIC";
  const applyExternal = profile.apply_mode === "EXTERNAL" || profile.apply_mode === "BOTH";
  const applyInternal = profile.apply_mode === "INTERNAL" || profile.apply_mode === "BOTH";

  return (
    <InstitutionProfileClient
      slug={slug}
      profile={profileForClient}
      institution={institution}
      reviews={reviews}
      posts={posts}
      qualifications={qualifications}
      rating={rating}
      review_count={review_count}
      showContact={showContact}
      contactEmail={profile.contact_email}
      contactPhone={profile.contact_phone}
      applyExternal={applyExternal}
      applyInternal={applyInternal}
      applyUrl={profile.apply_url}
      compliance={compliance}
      contacts={contacts}
    />
  );
}
