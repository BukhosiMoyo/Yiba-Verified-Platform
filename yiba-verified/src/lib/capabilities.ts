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
  | "FEATURE_ALERTS";

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
  ]),
  QCTO_USER: new Set([
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
  ]),
  STUDENT: new Set([
    // self-only views are enforced in backend/routes
    "LEARNER_VIEW",
    "ATTENDANCE_VIEW",
  ]),
};

export function hasCap(role: Role, cap: Capability): boolean {
  return CAPS[role]?.has(cap) ?? false;
}