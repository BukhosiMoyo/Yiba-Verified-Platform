// Role → route access
// RBAC logic for determining route access based on user roles
export type Role =
  | "PLATFORM_ADMIN"
  | "QCTO_USER"
  | "INSTITUTION_ADMIN"
  | "INSTITUTION_STAFF"
  | "STUDENT";

export type RouteArea = "platform-admin" | "qcto" | "institution" | "student";

/**
 * Route-area access is STRICT and deny-by-default.
 * Fine-grained permissions happen in API/services layer.
 */
export const ROLE_ROUTE_ACCESS: Record<Role, RouteArea[]> = {
  PLATFORM_ADMIN: ["platform-admin"],
  QCTO_USER: ["qcto"],
  INSTITUTION_ADMIN: ["institution"],
  INSTITUTION_STAFF: ["institution"],
  STUDENT: ["student"],
};

export function canAccessArea(role: Role, area: RouteArea): boolean {
  return ROLE_ROUTE_ACCESS[role]?.includes(area) ?? false;
}