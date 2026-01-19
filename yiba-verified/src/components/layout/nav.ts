// Navigation item types and filtering utilities
import type { Role } from "@/lib/rbac";
import type { Capability } from "@/lib/capabilities";
import { hasCap } from "@/lib/capabilities";

export type NavItem = {
  label: string;
  href: string;
  iconKey?: string;
  capability?: Capability;
  badge?: number;
  /** Nested links (e.g. "All", "Pending" under Submissions). Shown as a dropdown. */
  children?: NavItem[];
};

/**
 * Filter navigation items based on role capabilities.
 * Recurses into children when present.
 */
export function filterNavItems(role: Role, items: NavItem[]): NavItem[] {
  return items
    .filter((item) => {
      if (item.capability && !hasCap(role, item.capability)) return false;
      return true;
    })
    .map((item) => {
      if (!item.children?.length) return item;
      const filteredChildren = filterNavItems(role, item.children);
      return { ...item, children: filteredChildren.length ? filteredChildren : undefined };
    });
}
