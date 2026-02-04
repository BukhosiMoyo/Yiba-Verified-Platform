// Role → route access
// RBAC logic for determining route access based on user roles
export type Role =
  | "PLATFORM_ADMIN"
  | "QCTO_USER"
  | "QCTO_SUPER_ADMIN"
  | "QCTO_ADMIN"
  | "QCTO_REVIEWER"
  | "QCTO_AUDITOR"
  | "QCTO_VIEWER"
  | "INSTITUTION_ADMIN"
  | "INSTITUTION_STAFF"
  | "STUDENT"
  | "ADVISOR"
  | "FACILITATOR";

export type RouteArea = "platform-admin" | "advisor" | "qcto" | "institution" | "student" | "account" | "announcements" | "facilitator";

/** QCTO roles that can access /qcto area (including legacy QCTO_USER) */
export const QCTO_ROLES: Role[] = [
  "QCTO_USER",
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
];

/** Roles that can access QCTO data (submissions, readiness, institutions, evidence, requests, audit, exports). */
export const QCTO_DATA_ACCESS_ROLES: Role[] = [
  "QCTO_USER",
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
  "PLATFORM_ADMIN",
];

export function canAccessQctoData(role: Role): boolean {
  return QCTO_DATA_ACCESS_ROLES.includes(role);
}

/**
 * Route-area access is STRICT and deny-by-default.
 * Fine-grained permissions happen in API/services layer.
 */
export const ROLE_ROUTE_ACCESS: Record<Role, RouteArea[]> = {
  PLATFORM_ADMIN: ["platform-admin", "advisor", "account", "announcements"],
  QCTO_USER: ["qcto", "account", "announcements"],
  QCTO_SUPER_ADMIN: ["qcto", "account", "announcements"],
  QCTO_ADMIN: ["qcto", "account", "announcements"],
  QCTO_REVIEWER: ["qcto", "account", "announcements"],
  QCTO_AUDITOR: ["qcto", "account", "announcements"],
  QCTO_VIEWER: ["qcto", "account", "announcements"],
  INSTITUTION_ADMIN: ["institution", "account", "announcements"],
  INSTITUTION_STAFF: ["institution", "account", "announcements"],
  STUDENT: ["student", "account", "announcements"],
  ADVISOR: ["advisor", "account", "announcements"],
  FACILITATOR: ["facilitator", "institution", "account", "announcements"],
};

export function canAccessArea(role: Role, area: RouteArea): boolean {
  return ROLE_ROUTE_ACCESS[role]?.includes(area) ?? false;
}