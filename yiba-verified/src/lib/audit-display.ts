/**
 * Human-readable formatters for audit log Field and Change (old_value/new_value).
 * Used by AuditLogsTableClient, AuditLogDiffViewer, and PlatformAdminDashboardClient.
 */

function humanizeLabel(s: string): string {
  return s
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

/** Human-readable label for audit field_name (e.g. first_name → "First name"). */
export function formatFieldLabel(field: string | null): string {
  if (field == null || field === "") return "—";
  const overrides: Record<string, string> = {
    first_name: "First name",
    last_name: "Last name",
    legal_name: "Legal name",
    trading_name: "Trading name",
    enrolment_id: "Enrolment",
    learner_id: "Learner",
    readiness_id: "Readiness",
    submission_id: "Submission",
    request_id: "Request",
    resource_id: "Resource",
    document_id: "Document",
    entity_id: "Entity",
    enrolment_status: "Enrolment status",
    readiness_status: "Readiness status",
    submission_type: "Submission type",
    created_by_user_id: "Created by",
    institution_id: "Institution",
  };
  const exact = overrides[field];
  if (exact) return exact;
  return humanizeLabel(field);
}

function humanizeEnumIfNeeded(s: string): string {
  if (/^[A-Z][A-Z0-9_]*$/.test(s)) {
    return s
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }
  return s;
}

/**
 * Human-readable display for audit old_value/new_value.
 * Avoids raw JSON: objects become "Status: Approved", arrays "3 items", enums "Approved".
 * @param v - JSON string or plain string
 * @param fieldName - When the value is a large object, try to show this key (e.g. "status") instead of "N fields"
 */
export function formatValueForDisplay(v: string | null, fieldName?: string | null): string {
  if (v == null || v === "") return "—";
  try {
    const p = JSON.parse(v);
    if (typeof p === "string") return humanizeEnumIfNeeded(p);
    if (typeof p === "number" || typeof p === "boolean") return String(p);
    if (Array.isArray(p)) {
      const scalars = p.every((x) => x == null || typeof x !== "object");
      if (scalars && p.length <= 3) return p.map(String).join(", ");
      return `${p.length} items`;
    }
    if (typeof p === "object" && p !== null) {
      const keys = Object.keys(p);
      if (keys.length === 0) return "—";
      const formatVal = (val: unknown): string => {
        if (val == null) return "—";
        if (typeof val === "object") {
          if (Array.isArray(val)) return `${(val as unknown[]).length} items`;
          return `${Object.keys(val).length} fields`;
        }
        return humanizeEnumIfNeeded(String(val));
      };
      if (keys.length === 1) {
        const k = keys[0];
        return `${humanizeLabel(k)}: ${formatVal(p[k])}`;
      }
      if (keys.length <= 4) {
        return keys.map((k) => `${humanizeLabel(k)}: ${formatVal(p[k])}`).join("; ");
      }
      // 5+ keys: avoid "46 fields → 31 fields". Prefer the named field, or a short preview.
      if (fieldName) {
        const fv = p[fieldName];
        if (fv != null && typeof fv !== "object" && !Array.isArray(fv)) {
          return `${humanizeLabel(fieldName)}: ${humanizeEnumIfNeeded(String(fv))}`;
        }
      }
      const preview: string[] = [];
      for (const k of keys) {
        if (preview.length >= 3) break;
        const val = p[k];
        if (val == null || typeof val === "object") continue;
        const s = String(val);
        if (s.length > 40) continue;
        preview.push(`${humanizeLabel(k)}: ${humanizeEnumIfNeeded(s)}`);
      }
      if (preview.length >= 2) {
        return preview.join("; ") + ` (+${keys.length - preview.length})`;
      }
      return `Record (${keys.length} fields)`;
    }
    return String(p);
  } catch {
    return humanizeEnumIfNeeded(v);
  }
}
