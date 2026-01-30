// GET /api/email-templates/[type] - Get one template by type
// PATCH /api/email-templates/[type] - Update template (role-scoped)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessTemplateType } from "@/lib/email/templates/access";
import { getDefaultTemplateForType } from "@/lib/email/templates/defaults";
import { createAuditLog } from "@/services/audit.service";
import type { Role } from "@/lib/rbac";
import type { EmailTemplateType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const ROLES_WITH_TEMPLATE_ACCESS: Role[] = [
  "PLATFORM_ADMIN",
  "INSTITUTION_ADMIN",
  "QCTO_SUPER_ADMIN",
];

function parseType(typeParam: string): EmailTemplateType | null {
  const valid: EmailTemplateType[] = [
    "INSTITUTION_ADMIN_INVITE",
    "INSTITUTION_STAFF_INVITE",
    "STUDENT_INVITE",
    "QCTO_INVITE",
    "PLATFORM_ADMIN_INVITE",
    "SYSTEM_NOTIFICATION",
    "AUTH_PASSWORD_RESET",
    "AUTH_EMAIL_VERIFY",
  ];
  return valid.includes(typeParam as EmailTemplateType)
    ? (typeParam as EmailTemplateType)
    : null;
}

/**
 * GET /api/email-templates/[type]
 * Returns a single template by type. 403 if caller cannot access this type.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);

    if (!ROLES_WITH_TEMPLATE_ACCESS.includes(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "You do not have access to email templates",
        403
      );
    }

    const type = parseType((await params).type);
    if (!type) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Invalid template type", 404);
    }

    if (!canAccessTemplateType(ctx.role, type)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "You do not have access to this template type",
        403
      );
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { type },
    });

    if (!template) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Template not found", 404);
    }

    return ok(template);
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/email-templates/[type]
 * Update template subject, body_sections, cta_text, footer_html, header_html. 403 if caller cannot access.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);

    if (!ROLES_WITH_TEMPLATE_ACCESS.includes(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "You do not have access to email templates",
        403
      );
    }

    const type = parseType((await params).type);
    if (!type) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Invalid template type", 404);
    }

    if (!canAccessTemplateType(ctx.role, type)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "You do not have access to this template type",
        403
      );
    }

    const body = await request.json().catch(() => ({}));
    const existing = await prisma.emailTemplate.findUnique({ where: { type } });

    if (!existing) {
      // Create on first edit (upsert)
      const defaults = getDefaultTemplateForType(type);
      const template = await prisma.emailTemplate.create({
        data: {
          type,
          name: defaults.name,
          subject: typeof body.subject === "string" && body.subject.trim() ? body.subject.trim() : defaults.subject,
          header_html: body.header_html !== undefined ? body.header_html : defaults.header_html,
          body_sections: body.body_sections !== undefined ? (body.body_sections as Prisma.InputJsonValue) : defaults.body_sections,
          cta_text: body.cta_text !== undefined ? body.cta_text : defaults.cta_text,
          footer_html: body.footer_html !== undefined ? body.footer_html : defaults.footer_html,
          is_active: typeof body.is_active === "boolean" ? body.is_active : true,
        },
      });
      await createAuditLog(prisma, {
        entityType: "EMAIL_TEMPLATE",
        entityId: template.id,
        fieldName: "template",
        oldValue: null,
        newValue: JSON.stringify({ type: template.type, name: template.name, subject: template.subject, is_active: template.is_active }),
        changedBy: ctx.userId,
        roleAtTime: ctx.role,
        changeType: "CREATE",
      });
      return ok(template);
    }

    const updateData: Prisma.EmailTemplateUpdateInput = {};
    if (typeof body.subject === "string") updateData.subject = body.subject;
    if (body.header_html !== undefined) updateData.header_html = body.header_html ?? null;
    if (body.body_sections !== undefined) updateData.body_sections = body.body_sections as Prisma.InputJsonValue;
    if (body.cta_text !== undefined) updateData.cta_text = body.cta_text ?? null;
    if (body.footer_html !== undefined) updateData.footer_html = body.footer_html ?? null;
    if (typeof body.is_active === "boolean") updateData.is_active = body.is_active;

    const template = await prisma.emailTemplate.update({
      where: { type },
      data: updateData,
    });

    await createAuditLog(prisma, {
      entityType: "EMAIL_TEMPLATE",
      entityId: template.id,
      fieldName: "template",
      oldValue: JSON.stringify({
        subject: existing.subject,
        is_active: existing.is_active,
      }),
      newValue: JSON.stringify({
        subject: template.subject,
        is_active: template.is_active,
      }),
      changedBy: ctx.userId,
      roleAtTime: ctx.role,
      changeType: "UPDATE",
    });

    return ok(template);
  } catch (error) {
    return fail(error);
  }
}
