/**
 * Shared navigation definitions per role.
 * Use these in layout (dashboard) and account so the main sidebar is consistent.
 */
import type { NavItem } from "@/components/layout/nav";
import { PROVINCES } from "@/lib/provinces";
import { QCTO_ROLES } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";

/** Resolve main sidebar nav for a role (platform-admin, institution, qcto, student). */
export function getNavigationItemsForRole(role: Role): NavItem[] {
  if (role === "PLATFORM_ADMIN") return getPlatformAdminNavItems();
  if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") return getInstitutionNavItems();
  if (QCTO_ROLES.includes(role)) return getQctoNavItems();
  if (role === "STUDENT") return getStudentNavItems();
  return [];
}

/** Platform-admin sidebar nav (used by /platform-admin and /account when role is PLATFORM_ADMIN). Includes Account. Badge for Invites is applied by the layout. */
export function getPlatformAdminNavItems(): NavItem[] {
  return [
    { label: "Dashboard", href: "/platform-admin", iconKey: "layout-dashboard" },
    { label: "Institutions", href: "/platform-admin/institutions", iconKey: "building-2" },
    { label: "Learners", href: "/platform-admin/learners", iconKey: "users" },
    { label: "Qualifications", href: "/platform-admin/qualifications", iconKey: "graduation-cap" },
    {
      label: "Users",
      href: "/platform-admin/users",
      iconKey: "users",
      capability: "STAFF_INVITE",
      childParam: "status",
      children: [
        { label: "All", href: "/platform-admin/users" },
        { label: "Active", href: "/platform-admin/users?status=ACTIVE" },
      ],
    },
    {
      label: "Invites",
      href: "/platform-admin/invites",
      iconKey: "mail",
      childParam: "status",
      children: [
        { label: "All", href: "/platform-admin/invites" },
        { label: "Queued", href: "/platform-admin/invites?status=QUEUED" },
        { label: "Sent", href: "/platform-admin/invites?status=SENT" },
        { label: "Accepted", href: "/platform-admin/invites?status=ACCEPTED" },
        { label: "Expired", href: "/platform-admin/invites?status=EXPIRED" },
      ],
    },
    { label: "Announcements", href: "/platform-admin/announcements", iconKey: "bell" },
    { label: "Audit Logs", href: "/platform-admin/audit-logs", iconKey: "file-text", capability: "AUDIT_VIEW" },
    { label: "Reports", href: "/platform-admin/reports", iconKey: "chart-column", capability: "REPORTS_VIEW" },
    { label: "System Health", href: "/platform-admin/system-health", iconKey: "activity" },
    {
      label: "Account",
      href: "/account/profile",
      iconKey: "user",
      childParam: "status",
      children: [
        { label: "Profile", href: "/account/profile" },
        { label: "Security", href: "/account/security" },
        { label: "Logs", href: "/account/logs" },
        { label: "Notifications", href: "/account/notifications" },
        { label: "Admin Preferences", href: "/account/admin-preferences" },
      ],
    },
  ];
}

/** Institution sidebar nav (used by /institution and /account when role is INSTITUTION_ADMIN or INSTITUTION_STAFF). Includes Account. */
export function getInstitutionNavItems(): NavItem[] {
  return [
    { label: "Dashboard", href: "/institution", iconKey: "layout-dashboard" },
    { label: "Institution Profile", href: "/institution/profile", iconKey: "building-2", capability: "INSTITUTION_PROFILE_EDIT" },
    { label: "Staff", href: "/institution/staff", iconKey: "users", capability: "STAFF_INVITE" },
    { label: "Invites", href: "/institution/invites", iconKey: "mail", capability: "STAFF_INVITE" },
    { label: "Announcements", href: "/institution/announcements", iconKey: "megaphone", capability: "INSTITUTION_PROFILE_EDIT" },
    { label: "Learners", href: "/institution/learners", iconKey: "graduation-cap", capability: "LEARNER_VIEW" },
    { label: "Enrolments", href: "/institution/enrolments", iconKey: "clipboard-list", capability: "LEARNER_VIEW" },
    { label: "Attendance Register", href: "/institution/attendance", iconKey: "clipboard-check", capability: "ATTENDANCE_VIEW" },
    {
      label: "Submissions",
      href: "/institution/submissions",
      iconKey: "upload",
      capability: "LEARNER_VIEW",
      childParam: "status",
      children: [
        { label: "All", href: "/institution/submissions" },
        { label: "Submitted", href: "/institution/submissions?status=SUBMITTED" },
        { label: "Under review", href: "/institution/submissions?status=UNDER_REVIEW" },
        { label: "Approved", href: "/institution/submissions?status=APPROVED" },
        { label: "Rejected", href: "/institution/submissions?status=REJECTED" },
      ],
    },
    {
      label: "QCTO Requests",
      href: "/institution/requests",
      iconKey: "file-question",
      capability: "LEARNER_VIEW",
      childParam: "status",
      children: [
        { label: "All", href: "/institution/requests" },
        { label: "Pending", href: "/institution/requests?status=PENDING" },
        { label: "Approved", href: "/institution/requests?status=APPROVED" },
        { label: "Rejected", href: "/institution/requests?status=REJECTED" },
      ],
    },
    {
      label: "Readiness (Form 5)",
      href: "/institution/readiness",
      iconKey: "file-text",
      capability: "FORM5_VIEW",
      childParam: "status",
      children: [
        { label: "All", href: "/institution/readiness" },
        { label: "Submitted", href: "/institution/readiness?status=SUBMITTED" },
        { label: "Under review", href: "/institution/readiness?status=UNDER_REVIEW" },
        { label: "Recommended", href: "/institution/readiness?status=RECOMMENDED" },
        { label: "Rejected", href: "/institution/readiness?status=REJECTED" },
      ],
    },
    {
      label: "Evidence Vault",
      href: "/institution/documents",
      iconKey: "folder-open",
      capability: "EVIDENCE_VIEW",
      childParam: "status",
      children: [
        { label: "All Documents", href: "/institution/documents" },
        { label: "Upload", href: "/institution/documents/upload" },
      ],
    },
    { label: "Reports", href: "/institution/reports", iconKey: "chart-column", capability: "REPORTS_VIEW" },
    { label: "Announcements", href: "/announcements", iconKey: "bell" },
    {
      label: "Account",
      href: "/account/profile",
      iconKey: "user",
      childParam: "status",
      children: [
        { label: "Profile", href: "/account/profile" },
        { label: "Security", href: "/account/security" },
        { label: "Logs", href: "/account/logs" },
        { label: "Notifications", href: "/account/notifications" },
        { label: "Organisation", href: "/account/organisation" },
      ],
    },
  ];
}

/** Student (learner) sidebar nav (used by /student and /account when role is STUDENT). Includes Account. */
export function getStudentNavItems(): NavItem[] {
  return [
    { label: "Dashboard", href: "/student", iconKey: "layout-dashboard" },
    { label: "My Profile & CV", href: "/student/profile", iconKey: "users", capability: "LEARNER_VIEW" },
    { label: "My Enrolments", href: "/student/enrolments", iconKey: "clipboard-list", capability: "LEARNER_VIEW" },
    { label: "Attendance", href: "/student/attendance", iconKey: "activity", capability: "ATTENDANCE_VIEW" },
    { label: "Certificates", href: "/student/certificates", iconKey: "award", capability: "LEARNER_VIEW" },
    { label: "Announcements", href: "/announcements", iconKey: "bell" },
    {
      label: "Account",
      href: "/account/profile",
      iconKey: "user",
      childParam: "status",
      children: [
        { label: "Profile", href: "/account/profile" },
        { label: "Security", href: "/account/security" },
        { label: "Logs", href: "/account/logs" },
        { label: "Notifications", href: "/account/notifications" },
        { label: "Academic Profile", href: "/account/academic-profile" },
      ],
    },
  ];
}

/** Full QCTO sidebar nav (used by /qcto and /account when role is QCTO_USER or PLATFORM_ADMIN on QCTO). Includes Account. */
export function getQctoNavItems(): NavItem[] {
  return [
    { label: "Dashboard", href: "/qcto", iconKey: "layout-dashboard" },
    { label: "QCTO Team", href: "/qcto/team", iconKey: "users", capability: "QCTO_TEAM_MANAGE" },
    {
      label: "Submissions",
      href: "/qcto/submissions",
      iconKey: "upload",
      children: [
        { label: "All", href: "/qcto/submissions" },
        { label: "Pending", href: "/qcto/submissions?status=SUBMITTED" },
        { label: "Under review", href: "/qcto/submissions?status=UNDER_REVIEW" },
        { label: "Approved", href: "/qcto/submissions?status=APPROVED" },
        { label: "Rejected", href: "/qcto/submissions?status=REJECTED" },
      ],
    },
    {
      label: "Requests",
      href: "/qcto/requests",
      iconKey: "file-question",
      children: [
        { label: "All", href: "/qcto/requests" },
        { label: "Pending", href: "/qcto/requests?status=PENDING" },
        { label: "Approved", href: "/qcto/requests?status=APPROVED" },
        { label: "Rejected", href: "/qcto/requests?status=REJECTED" },
      ],
    },
    {
      label: "Institutions",
      href: "/qcto/institutions",
      iconKey: "building-2",
      childParam: "province",
      children: [
        { label: "All", href: "/qcto/institutions" },
        ...PROVINCES.map((p) => ({ label: p, href: `/qcto/institutions?province=${encodeURIComponent(p)}` })),
      ],
    },
    {
      label: "Readiness Reviews",
      href: "/qcto/readiness",
      iconKey: "eye",
      capability: "FORM5_VIEW",
      children: [
        { label: "All", href: "/qcto/readiness" },
        { label: "Pending", href: "/qcto/readiness?status=SUBMITTED" },
        { label: "Under review", href: "/qcto/readiness?status=UNDER_REVIEW" },
        { label: "Recommended", href: "/qcto/readiness?status=RECOMMENDED" },
        { label: "Rejected", href: "/qcto/readiness?status=REJECTED" },
      ],
    },
    { label: "Evidence Flags", href: "/qcto/evidence-flags", iconKey: "flag", capability: "EVIDENCE_VIEW" },
    { label: "Audit Logs", href: "/qcto/audit-logs", iconKey: "file-text", capability: "AUDIT_VIEW" },
    { label: "Reports", href: "/qcto/reports", iconKey: "chart-column", capability: "REPORTS_VIEW" },
    { label: "Announcements", href: "/announcements", iconKey: "bell" },
    {
      label: "Account",
      href: "/account/profile",
      iconKey: "user",
      childParam: "status",
      children: [
        { label: "Profile", href: "/account/profile" },
        { label: "Security", href: "/account/security" },
        { label: "Logs", href: "/account/logs" },
        { label: "Notifications", href: "/account/notifications" },
        { label: "Scope / Assignments", href: "/account/scope-assignments" },
      ],
    },
  ];
}
