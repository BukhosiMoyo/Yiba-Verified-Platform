/**
 * GET /api/institution/profile - Get current user's institution profile
 * PATCH /api/institution/profile - Update institution profile (INSTITUTION_ADMIN or PLATFORM_ADMIN only)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";

export async function GET(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        if (!ctx.institutionId) {
            return fail(new AppError(ERROR_CODES.FORBIDDEN, "User is not associated with an institution", 403));
        }

        const institution = await prisma.institution.findUnique({
            where: { institution_id: ctx.institutionId },
            select: {
                institution_id: true,
                legal_name: true,
                trading_name: true,
                institution_type: true,
                registration_number: true,
                physical_address: true,
                postal_address: true,
                province: true,
                delivery_modes: true,
                status: true,
                contact_person_name: true,
                contact_email: true,
                contact_number: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!institution) {
            return fail(new AppError(ERROR_CODES.NOT_FOUND, "Institution not found", 404));
        }

        return Response.json(institution);
    } catch (error) {
        if (error instanceof AppError) return fail(error);
        console.error("GET /api/institution/profile error:", error);
        return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to load institution profile", 500));
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        if (!ctx.institutionId) {
            return fail(new AppError(ERROR_CODES.FORBIDDEN, "User is not associated with an institution", 403));
        }

        // Check for INSTITUTION_PROFILE_EDIT capability
        if (ctx.role !== "PLATFORM_ADMIN" && !hasCap(ctx.role, "INSTITUTION_PROFILE_EDIT")) {
            return fail(new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to edit institution profile", 403));
        }

        const body = await request.json();

        // Extract and validate editable fields
        const contact_person_name = body?.contact_person_name !== undefined
            ? (body.contact_person_name === null ? null : String(body.contact_person_name).trim())
            : undefined;

        const contact_email = body?.contact_email !== undefined
            ? (body.contact_email === null ? null : String(body.contact_email).trim())
            : undefined;

        const contact_number = body?.contact_number !== undefined
            ? (body.contact_number === null ? null : String(body.contact_number).trim())
            : undefined;

        const physical_address = body?.physical_address !== undefined
            ? (body.physical_address === null ? null : String(body.physical_address).trim())
            : undefined;

        const postal_address = body?.postal_address !== undefined
            ? (body.postal_address === null ? null : String(body.postal_address).trim())
            : undefined;

        const delivery_modes = body?.delivery_modes !== undefined
            ? body.delivery_modes
            : undefined;

        // Validate email format if provided
        if (contact_email !== undefined && contact_email !== null && contact_email !== "") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contact_email)) {
                return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid email format", 400));
            }
        }

        // Validate delivery modes if provided
        if (delivery_modes !== undefined) {
            const validModes = ["FACE_TO_FACE", "BLENDED", "MOBILE"];
            if (!Array.isArray(delivery_modes)) {
                return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Delivery modes must be an array", 400));
            }
            for (const mode of delivery_modes) {
                if (!validModes.includes(mode)) {
                    return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, `Invalid delivery mode: ${mode}`, 400));
                }
            }
        }

        // Build update data object
        const data: Record<string, unknown> = {};
        if (contact_person_name !== undefined) data.contact_person_name = contact_person_name;
        if (contact_email !== undefined) data.contact_email = contact_email;
        if (contact_number !== undefined) data.contact_number = contact_number;
        if (physical_address !== undefined) data.physical_address = physical_address;
        if (postal_address !== undefined) data.postal_address = postal_address;
        if (delivery_modes !== undefined) data.delivery_modes = delivery_modes;

        // Update institution
        const updated = await prisma.institution.update({
            where: { institution_id: ctx.institutionId },
            data: data as Parameters<typeof prisma.institution.update>[0]["data"],
            select: {
                institution_id: true,
                legal_name: true,
                trading_name: true,
                institution_type: true,
                registration_number: true,
                physical_address: true,
                postal_address: true,
                province: true,
                delivery_modes: true,
                status: true,
                contact_person_name: true,
                contact_email: true,
                contact_number: true,
                created_at: true,
                updated_at: true,
            },
        });

        return Response.json(updated);
    } catch (error) {
        if (error instanceof AppError) return fail(error);
        console.error("PATCH /api/institution/profile error:", error);
        return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to update institution profile", 500));
    }
}
