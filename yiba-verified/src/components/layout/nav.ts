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
  /** Query param used by children for "active" state: "status" (default) or "province". */
  childParam?: "status" | "province";
};

/**
 * Filter navigation items based on role capabilities.
 * Recurses into children when present.
 */
export function filterNavItems(role: Role, items: NavItem[]): NavItem[] {
  if (!items || !Array.isArray(items)) return [];
  
  return items
    .filter((item) => {
      if (!item || typeof item !== "object") return false;
      if (item.capability && !hasCap(role, item.capability)) return false;
      if (!item.href || typeof item.href !== "string") return false; // Safety check: filter out items without valid href
      return true;
    })
    .map((item) => {
      if (!item.children || !Array.isArray(item.children) || item.children.length === 0) {
        return item;
      }
      // Recursively filter children and ensure they all have valid hrefs
      const filteredChildren = filterNavItems(role, item.children).filter((child) => 
        child && child.href && typeof child.href === "string"
      );
      return { 
        ...item, 
        children: filteredChildren.length > 0 ? filteredChildren : undefined 
      };
    })
    .filter((item) => item && item.href); // Final safety check
}
