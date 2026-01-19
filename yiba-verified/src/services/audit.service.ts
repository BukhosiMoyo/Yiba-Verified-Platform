// Audit service - transactional audit logging
// All mutations must use this service to ensure audit logs are written atomically

import type { PrismaClient, AuditEntityType, AuditChangeType, UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type AuditLogEntry = {
  entityType: AuditEntityType;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  roleAtTime: UserRole;
  reason?: string | null;
  institutionId?: string | null;
  changeType: AuditChangeType;
  relatedSubmissionId?: string | null;
};

/**
 * Create audit log entry within a transaction
 * This ensures audit writes are atomic with data changes
 *
 * Usage:
 * ```ts
 * await prisma.$transaction(async (tx) => {
 *   // Your data mutation
 *   const updated = await tx.learner.update({ ... });
 *
 *   // Create audit log
 *   await createAuditLog(tx, {
 *     entityType: 'LEARNER',
 *     entityId: updated.learner_id,
 *     fieldName: 'first_name',
 *     oldValue: oldValue,
 *     newValue: updated.first_name,
 *     changedBy: userId,
 *     roleAtTime: userRole,
 *     changeType: 'UPDATE',
 *     institutionId: updated.institution_id,
 *   });
 *
 *   return updated;
 * });
 * ```
 */
export async function createAuditLog(
  prisma: PrismaClient | Prisma.TransactionClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        field_name: entry.fieldName,
        old_value: entry.oldValue,
        new_value: entry.newValue,
        changed_by: entry.changedBy,
        role_at_time: entry.roleAtTime,
        reason: entry.reason ?? null,
        institution_id: entry.institutionId ?? null,
        change_type: entry.changeType,
        related_submission_id: entry.relatedSubmissionId ?? null,
      },
    });
  } catch (error) {
    // If audit log creation fails, the transaction will rollback
    // This ensures data integrity - no data change without audit trail
    console.error("Failed to create audit log:", error);
    throw new Error("Audit log creation failed - transaction aborted");
  }
}

/**
 * Create multiple audit log entries in a single transaction
 * Useful when multiple fields change in one operation
 */
export async function createAuditLogs(
  prisma: PrismaClient | Prisma.TransactionClient,
  entries: AuditLogEntry[]
): Promise<void> {
  try {
    await prisma.auditLog.createMany({
      data: entries.map((entry) => ({
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        field_name: entry.fieldName,
        old_value: entry.oldValue,
        new_value: entry.newValue,
        changed_by: entry.changedBy,
        role_at_time: entry.roleAtTime,
        reason: entry.reason ?? null,
        institution_id: entry.institutionId ?? null,
        change_type: entry.changeType,
        related_submission_id: entry.relatedSubmissionId ?? null,
      })),
    });
  } catch (error) {
    console.error("Failed to create audit logs:", error);
    throw new Error("Audit log creation failed - transaction aborted");
  }
}

/**
 * Helper to determine change type from operation
 */
export function getChangeType(
  operation: "create" | "update" | "delete" | "status_change"
): AuditChangeType {
  switch (operation) {
    case "create":
      return "CREATE";
    case "update":
      return "UPDATE";
    case "delete":
      return "DELETE";
    case "status_change":
      return "STATUS_CHANGE";
    default:
      return "UPDATE";
  }
}

/**
 * Helper to serialize values for audit log
 * Converts any value to string representation
 */
export function serializeValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Create audit log for a field change
 * Helper function that handles value serialization
 */
export async function auditFieldChange(
  prisma: PrismaClient | Prisma.TransactionClient,
  params: {
    entityType: AuditEntityType;
    entityId: string;
    fieldName: string;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string;
    roleAtTime: UserRole;
    changeType: AuditChangeType;
    reason?: string | null;
    institutionId?: string | null;
    relatedSubmissionId?: string | null;
  }
): Promise<void> {
  await createAuditLog(prisma, {
    entityType: params.entityType,
    entityId: params.entityId,
    fieldName: params.fieldName,
    oldValue: serializeValue(params.oldValue),
    newValue: serializeValue(params.newValue),
    changedBy: params.changedBy,
    roleAtTime: params.roleAtTime,
    changeType: params.changeType,
    reason: params.reason ?? null,
    institutionId: params.institutionId ?? null,
    relatedSubmissionId: params.relatedSubmissionId ?? null,
  });
}
