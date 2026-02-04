// Role → UI capabilities
// Maps user roles to UI capabilities and permissions
import type { Role } from "./rbac";

export type Capability =
  | "INSTITUTION_PROFILE_EDIT"
  | "STAFF_INVITE"
  | "STAFF_ASSIGN_ROLES"
  | "STAFF_DEACTIVATE"
  | "FORM5_VIEW"
  | "FORM5_EDIT"
  | "FORM5_SUBMIT"
  | "QCTO_REVIEW_FLAG"
  | "QCTO_RECORD_RECOMMENDATION"
  | "EVIDENCE_VIEW"
  | "EVIDENCE_UPLOAD"
  | "EVIDENCE_REPLACE"
  | "LEARNER_VIEW"
  | "LEARNER_CREATE"
  | "LEARNER_EDIT"
  | "LEARNER_ARCHIVE"
  | "ENROLMENT_CREATE"
  | "ENROLMENT_EDIT_STATUS"
  | "ATTENDANCE_CAPTURE"
  | "ATTENDANCE_VIEW"
  | "AUDIT_VIEW"
  | "AUDIT_EXPORT"
  | "REPORTS_VIEW"
  | "REPORTS_EXPORT"
  | "FEATURE_APPROVE"
  | "FEATURE_ALERTS"
  // QCTO-specific
  | "QCTO_TEAM_MANAGE"
  | "QCTO_REVIEW"
  | "QCTO_ASSIGN"
  | "QCTO_AUDIT_READ"
  | "QCTO_EXPORT"
  | "QCTO_SETTINGS"
  // Institution staff sub-roles (capability-based)
  | "CAN_FACILITATE"
  | "CAN_ASSESS"
  | "CAN_MODERATE"
  | "CAN_VIEW_LEADS"
  | "CAN_MANAGE_PUBLIC_PROFILE"
  // Service requests (advisor / platform admin)
  | "SERVICE_REQUESTS_VIEW"
  | "SERVICE_REQUESTS_EDIT";

const CAPS: Record<Role, Set<Capability>> = {
  PLATFORM_ADMIN: new Set([
    "INSTITUTION_PROFILE_EDIT",
    "STAFF_INVITE",
    "STAFF_ASSIGN_ROLES",
    "STAFF_DEACTIVATE",
    "FORM5_VIEW",
    "FORM5_EDIT",
    "FORM5_SUBMIT",
    "EVIDENCE_VIEW",
    "EVIDENCE_UPLOAD",
    "EVIDENCE_REPLACE",
    "LEARNER_VIEW",
    "LEARNER_CREATE",
    "LEARNER_EDIT",
    "LEARNER_ARCHIVE",
    "ENROLMENT_CREATE",
    "ENROLMENT_EDIT_STATUS",
    "ATTENDANCE_CAPTURE",
    "ATTENDANCE_VIEW",
    "AUDIT_VIEW",
    "AUDIT_EXPORT",
    "REPORTS_VIEW",
    "REPORTS_EXPORT",
    "FEATURE_APPROVE",
    "FEATURE_ALERTS",
    "QCTO_TEAM_MANAGE",
    "CAN_FACILITATE",
    "CAN_ASSESS",
    "CAN_MODERATE",
    "CAN_VIEW_LEADS",
    "CAN_MANAGE_PUBLIC_PROFILE",
    "SERVICE_REQUESTS_VIEW",
    "SERVICE_REQUESTS_EDIT",
  ]),
  QCTO_USER: new Set([
    "FORM5_VIEW",
    "EVIDENCE_VIEW",
    "QCTO_REVIEW_FLAG",
    "QCTO_RECORD_RECOMMENDATION",
    "QCTO_REVIEW",
    "QCTO_AUDIT_READ",
    "QCTO_EXPORT",
    "LEARNER_VIEW",
    "ATTENDANCE_VIEW",
    "AUDIT_VIEW",
    "AUDIT_EXPORT",
    "REPORTS_VIEW",
    "REPORTS_EXPORT",
  ]),
  QCTO_SUPER_ADMIN: new Set([
    "QCTO_TEAM_MANAGE",
    "QCTO_REVIEW",
    "QCTO_ASSIGN",
    "QCTO_AUDIT_READ",
    "QCTO_EXPORT",
    "QCTO_SETTINGS",
    "FORM5_VIEW",
    "EVIDENCE_VIEW",
    "QCTO_REVIEW_FLAG",
    "QCTO_RECORD_RECOMMENDATION",
    "LEARNER_VIEW",
    "ATTENDANCE_VIEW",
    "AUDIT_VIEW",
    "AUDIT_EXPORT",
    "REPORTS_VIEW",
    "REPORTS_EXPORT",
  ]),
  QCTO_ADMIN: new Set([
    "QCTO_TEAM_MANAGE",
    "QCTO_REVIEW",
    "QCTO_ASSIGN",
    "QCTO_AUDIT_READ",
    "QCTO_EXPORT",
    "FORM5_VIEW",
    "EVIDENCE_VIEW",
    "QCTO_REVIEW_FLAG",
    "QCTO_RECORD_RECOMMENDATION",
    "LEARNER_VIEW",
    "ATTENDANCE_VIEW",
    "AUDIT_VIEW",
    "AUDIT_EXPORT",
    "REPORTS_VIEW",
    "REPORTS_EXPORT",
  ]),
  QCTO_REVIEWER: new Set([
    "QCTO_REVIEW",
    "FORM5_VIEW",
    "EVIDENCE_VIEW",
    "QCTO_REVIEW_FLAG",
    "QCTO_RECORD_RECOMMENDATION",
    "LEARNER_VIEW",
    "ATTENDANCE_VIEW",
    "AUDIT_VIEW",
    "REPORTS_VIEW",
  ]),
  QCTO_AUDITOR: new Set([
    "QCTO_AUDIT_READ",
    "QCTO_EXPORT",
    "AUDIT_VIEW",
    "AUDIT_EXPORT",
    "REPORTS_VIEW",
    "REPORTS_EXPORT",
  ]),
  QCTO_VIEWER: new Set([
    "FORM5_VIEW",
    "EVIDENCE_VIEW",
    "LEARNER_VIEW",
    "ATTENDANCE_VIEW",
    "AUDIT_VIEW",
    "REPORTS_VIEW",
  ]),
  INSTITUTION_ADMIN: new Set([
    "INSTITUTION_PROFILE_EDIT",
    "STAFF_INVITE",
    "STAFF_ASSIGN_ROLES",
    "STAFF_DEACTIVATE",
    "FORM5_VIEW",
    "FORM5_EDIT",
    "FORM5_SUBMIT",
    "EVIDENCE_VIEW",
    "EVIDENCE_UPLOAD",
    "EVIDENCE_REPLACE",
    "LEARNER_VIEW",
    "LEARNER_CREATE",
    "LEARNER_EDIT",
    "LEARNER_ARCHIVE",
    "ENROLMENT_CREATE",
    "ENROLMENT_EDIT_STATUS",
    "ATTENDANCE_CAPTURE",
    "ATTENDANCE_VIEW",
    "AUDIT_VIEW",
    "REPORTS_VIEW",
    "REPORTS_EXPORT",
    "CAN_VIEW_LEADS",
    "CAN_MANAGE_PUBLIC_PROFILE",
  ]),
  INSTITUTION_STAFF: new Set([
    "FORM5_VIEW",
    "FORM5_EDIT",        // assigned-only (enforced in backend)
    "EVIDENCE_VIEW",
    "EVIDENCE_UPLOAD",   // assigned-only
    "EVIDENCE_REPLACE",  // assigned-only
    "LEARNER_VIEW",
    "LEARNER_CREATE",    // assigned-only
    "LEARNER_EDIT",      // assigned-only
    "ENROLMENT_CREATE",  // assigned-only
    "ATTENDANCE_CAPTURE",
    "ATTENDANCE_VIEW",
    "AUDIT_VIEW",        // own actions only (enforced in backend)
    "REPORTS_VIEW",
    "CAN_VIEW_LEADS",
    // CAN_FACILITATE, CAN_ASSESS, CAN_MODERATE: optional per-institution (not in default set)
  ]),
  STUDENT: new Set([
    // self-only views are enforced in backend/routes
    "LEARNER_VIEW",
    "ATTENDANCE_VIEW",
  ]),
  ADVISOR: new Set([
    "SERVICE_REQUESTS_VIEW",
    "SERVICE_REQUESTS_EDIT",
    "ATTENDANCE_VIEW", // Optional, if they need to see attendance
    "REPORTS_VIEW",
  ]),

  FACILITATOR: new Set([
    "ATTENDANCE_VIEW",
    "ATTENDANCE_CAPTURE",
  ]),
};

export function hasCap(role: Role, cap: Capability): boolean {
  return CAPS[role]?.has(cap) ?? false;
}