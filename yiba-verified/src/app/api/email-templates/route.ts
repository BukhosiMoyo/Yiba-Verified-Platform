// GET /api/email-templates - List email templates (role-scoped: only types the caller can access)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getAllowedTemplateTypesForRole } from "@/lib/email/templates/access";
import type { Role } from "@/lib/rbac";

const ROLES_WITH_TEMPLATE_ACCESS: Role[] = [
  "PLATFORM_ADMIN",
  "INSTITUTION_ADMIN",
  "QCTO_SUPER_ADMIN",
];

/**
 * GET /api/email-templates
 * Returns email templates filtered by caller role.
 * Platform Admin = all invite + auth; Institution Admin = institution/student; QCTO Super Admin = QCTO only.
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!ROLES_WITH_TEMPLATE_ACCESS.includes(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "You do not have access to email templates",
        403
      );
    }

    const allowedTypes = getAllowedTemplateTypesForRole(ctx.role);
    const templates = await prisma.emailTemplate.findMany({
      where: { type: { in: allowedTypes } },
      select: {
        id: true,
        type: true,
        name: true,
        subject: true,
        header_html: true,
        body_sections: true,
        cta_text: true,
        footer_html: true,
        is_active: true,
        updated_at: true,
      },
      orderBy: { type: "asc" },
    });

    return ok({ items: templates });
  } catch (error) {
    return fail(error);
  }
}
