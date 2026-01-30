/**
 * GET /api/institution/public-profile - Get current institution's public profile (create default if missing)
 * PATCH /api/institution/public-profile - Update public profile (INSTITUTION_ADMIN or INSTITUTION_PROFILE_EDIT)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "institution";
}

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);
    if (!ctx.institutionId) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "User is not associated with an institution", 403));
    }
    const role = ctx.role;
    if (role !== "INSTITUTION_ADMIN" && role !== "INSTITUTION_STAFF" && role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only institution staff can view public profile", 403));
    }

    let profile = await prisma.institutionPublicProfile.findUnique({
      where: { institution_id: ctx.institutionId },
      include: { institution: { select: { legal_name: true, trading_name: true } } },
    });

    if (!profile) {
      const inst = await prisma.institution.findUnique({
        where: { institution_id: ctx.institutionId },
        select: { legal_name: true, trading_name: true },
      });
      if (!inst) return fail(new AppError(ERROR_CODES.NOT_FOUND, "Institution not found", 404));
      let baseSlug = slugify(inst.trading_name || inst.legal_name);
      let slug = baseSlug;
      let n = 0;
      while (await prisma.institutionPublicProfile.findUnique({ where: { slug } })) {
        n += 1;
        slug = `${baseSlug}-${n}`;
      }
      profile = await prisma.institutionPublicProfile.create({
        data: {
          institution_id: ctx.institutionId,
          slug,
          is_public: false,
        },
        include: { institution: { select: { legal_name: true, trading_name: true } } },
      });
    }

    return Response.json(profile);
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/institution/public-profile error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to load public profile", 500));
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);
    if (!ctx.institutionId) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "User is not associated with an institution", 403));
    }
    if (ctx.role !== "PLATFORM_ADMIN" && !hasCap(ctx.role, "CAN_MANAGE_PUBLIC_PROFILE")) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to edit public profile", 403));
    }

    let profile = await prisma.institutionPublicProfile.findUnique({
      where: { institution_id: ctx.institutionId },
    });
    if (!profile) {
      const inst = await prisma.institution.findUnique({
        where: { institution_id: ctx.institutionId },
        select: { legal_name: true, trading_name: true },
      });
      if (!inst) return fail(new AppError(ERROR_CODES.NOT_FOUND, "Institution not found", 404));
      let baseSlug = slugify(inst.trading_name || inst.legal_name);
      let slug = baseSlug;
      let n = 0;
      while (await prisma.institutionPublicProfile.findUnique({ where: { slug } })) {
        n += 1;
        slug = `${baseSlug}-${n}`;
      }
      profile = await prisma.institutionPublicProfile.create({
        data: { institution_id: ctx.institutionId, slug, is_public: false },
      });
    }

    const body = await request.json();
    const slug = typeof body?.slug === "string" ? body.slug.trim() : undefined;
    const is_public = typeof body?.is_public === "boolean" ? body.is_public : undefined;
    const tagline = body?.tagline !== undefined ? (body.tagline === null ? null : String(body.tagline).trim()) : undefined;
    const about = body?.about !== undefined ? (body.about === null ? null : String(body.about).trim()) : undefined;
    const logo_url = body?.logo_url !== undefined ? (body.logo_url === null ? null : String(body.logo_url).trim()) : undefined;
    const banner_url = body?.banner_url !== undefined ? (body.banner_url === null ? null : String(body.banner_url).trim()) : undefined;
    const contact_email = body?.contact_email !== undefined ? (body.contact_email === null ? null : String(body.contact_email).trim()) : undefined;
    const contact_phone = body?.contact_phone !== undefined ? (body.contact_phone === null ? null : String(body.contact_phone).trim()) : undefined;
    const contact_visibility = body?.contact_visibility !== undefined ? body.contact_visibility : undefined;
    const apply_mode = body?.apply_mode !== undefined ? body.apply_mode : undefined;
    const apply_url = body?.apply_url !== undefined ? (body.apply_url === null ? null : String(body.apply_url).trim()) : undefined;
    const featured_until = body?.featured_until !== undefined ? (body.featured_until === null ? null : new Date(body.featured_until)) : undefined;
    const featured_priority = body?.featured_priority !== undefined ? (body.featured_priority === null ? 0 : Number(body.featured_priority)) : undefined;

    if (slug !== undefined) {
      if (!slug || slug.length < 2) return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Slug must be at least 2 characters", 400));
      const existing = await prisma.institutionPublicProfile.findUnique({ where: { slug } });
      if (existing && existing.institution_id !== ctx.institutionId) {
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Slug is already in use", 400));
      }
    }

    if (apply_mode === "EXTERNAL" || apply_mode === "BOTH") {
      const url = apply_url ?? profile.apply_url;
      if (!url || !url.trim()) return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Apply URL is required when apply mode is EXTERNAL or BOTH", 400));
    }

    const data: Record<string, unknown> = {};
    if (slug !== undefined) data.slug = slug;
    if (is_public !== undefined) data.is_public = is_public;
    if (tagline !== undefined) data.tagline = tagline;
    if (about !== undefined) data.about = about;
    if (logo_url !== undefined) data.logo_url = logo_url;
    if (banner_url !== undefined) data.banner_url = banner_url;
    if (contact_email !== undefined) data.contact_email = contact_email;
    if (contact_phone !== undefined) data.contact_phone = contact_phone;
    if (contact_visibility !== undefined) data.contact_visibility = contact_visibility;
    if (apply_mode !== undefined) data.apply_mode = apply_mode;
    if (apply_url !== undefined) data.apply_url = apply_url;
    if (featured_until !== undefined) data.featured_until = featured_until;
    if (featured_priority !== undefined) data.featured_priority = featured_priority;

    const updated = await prisma.institutionPublicProfile.update({
      where: { institution_id: ctx.institutionId },
      data: data as Parameters<typeof prisma.institutionPublicProfile.update>[0]["data"],
    });

    return Response.json(updated);
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("PATCH /api/institution/public-profile error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to update public profile", 500));
  }
}
