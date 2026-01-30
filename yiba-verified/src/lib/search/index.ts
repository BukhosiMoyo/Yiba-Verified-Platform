// Global Search Index
// Builds a searchable index from available routes based on user role

import type { Role } from "@/lib/rbac";
import { canAccessArea } from "@/lib/rbac";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  FileText,
  Activity,
  ClipboardList,
  FolderOpen,
  Flag,
  Award,
  type LucideIcon,
} from "lucide-react";

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  category: "institutions" | "learners" | "users" | "audit-logs" | "documents" | "pages" | "submissions" | "requests" | "readiness" | "enrolments" | "facilitators";
  icon: LucideIcon;
};

// Icon mapping
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  institutions: Building2,
  learners: GraduationCap,
  users: Users,
  "audit-logs": Activity,
  documents: FileText,
  submissions: ClipboardList,
  requests: Flag,
  readiness: FolderOpen,
  enrolments: Award,
  qualifications: Award,
  facilitators: Users,
};

// Base searchable items by category
const SEARCH_ITEMS: Omit<SearchResult, "id">[] = [
  // Platform Admin
  { title: "Dashboard", href: "/platform-admin", category: "pages", icon: ICONS.dashboard },
  { title: "Institutions", href: "/platform-admin/institutions", category: "institutions", icon: ICONS.institutions },
  { title: "Learners", href: "/platform-admin/learners", category: "learners", icon: ICONS.learners },
  { title: "Qualifications", href: "/platform-admin/qualifications", category: "pages", icon: ICONS.qualifications },
  { title: "Audit Logs", href: "/platform-admin/audit-logs", category: "audit-logs", icon: ICONS["audit-logs"] },
  
  // Institution
  { title: "Dashboard", href: "/institution", category: "pages", icon: ICONS.dashboard, subtitle: "Institution" },
  { title: "Submissions", href: "/institution/submissions", category: "submissions", icon: ICONS.submissions },
  { title: "New Submission", href: "/institution/submissions/new", category: "submissions", icon: ICONS.submissions },
  { title: "Requests", href: "/institution/requests", category: "requests", icon: ICONS.requests },
  { title: "Readiness", href: "/institution/readiness", category: "readiness", icon: ICONS.readiness },
  { title: "New Readiness", href: "/institution/readiness/new", category: "readiness", icon: ICONS.readiness },
  { title: "Documents", href: "/institution/documents", category: "documents", icon: ICONS.documents },
  { title: "Upload Document", href: "/institution/documents/upload", category: "documents", icon: ICONS.documents },
  { title: "Enrolments", href: "/institution/enrolments", category: "enrolments", icon: ICONS.enrolments },
  { title: "Learners", href: "/institution/learners", category: "learners", icon: ICONS.learners },
  
  // QCTO
  { title: "Dashboard", href: "/qcto", category: "pages", icon: ICONS.dashboard, subtitle: "QCTO" },
  { title: "Submissions", href: "/qcto/submissions", category: "submissions", icon: ICONS.submissions },
  { title: "Requests", href: "/qcto/requests", category: "requests", icon: ICONS.requests },
  { title: "Readiness", href: "/qcto/readiness", category: "readiness", icon: ICONS.readiness },
  { title: "Facilitators", href: "/qcto/facilitators", category: "facilitators", icon: ICONS.facilitators },
  
  // Student
  { title: "Dashboard", href: "/student", category: "pages", icon: ICONS.dashboard, subtitle: "Student" },
  
  // General
  { title: "Notifications", href: "/notifications", category: "pages", icon: Activity },
];

/**
 * Get searchable items filtered by role
 */
export function getSearchableItems(role: Role): SearchResult[] {
  const items = SEARCH_ITEMS.filter((item) => {
    // Filter by route area access
    if (item.href.startsWith("/platform-admin")) {
      return canAccessArea(role, "platform-admin");
    }
    if (item.href.startsWith("/institution")) {
      return canAccessArea(role, "institution");
    }
    if (item.href.startsWith("/qcto")) {
      return canAccessArea(role, "qcto");
    }
    if (item.href.startsWith("/student")) {
      return canAccessArea(role, "student");
    }
    // General routes (notifications, etc.) are accessible to all
    return true;
  });

  return items.map((item, index) => ({
    ...item,
    id: `${item.href}-${index}`,
  }));
}

/**
 * Search items by query string
 */
export function searchItems(items: SearchResult[], query: string, category?: string): SearchResult[] {
  const lowerQuery = query.toLowerCase().trim();
  
  // First filter by category if specified
  let filtered = items;
  if (category && category !== "mixed") {
    filtered = items.filter((item) => item.category === category);
  }

  // Then filter by query if provided
  if (lowerQuery) {
    filtered = filtered.filter((item) => {
      const matchesTitle = item.title.toLowerCase().includes(lowerQuery);
      const matchesSubtitle = item.subtitle?.toLowerCase().includes(lowerQuery);
      const matchesCategory = item.category.toLowerCase().includes(lowerQuery);
      return matchesTitle || matchesSubtitle || matchesCategory;
    });
  }

  return filtered;
}

/**
 * Group results by category
 */
export function groupResults(results: SearchResult[]): Record<string, SearchResult[]> {
  const grouped: Record<string, SearchResult[]> = {};
  
  results.forEach((result) => {
    if (!grouped[result.category]) {
      grouped[result.category] = [];
    }
    grouped[result.category].push(result);
  });

  return grouped;
}

/**
 * Category labels for display
 */
export const CATEGORY_LABELS: Record<string, string> = {
  mixed: "Mixed",
  institutions: "Institutions",
  learners: "Learners",
  users: "Users",
  "audit-logs": "Audit Logs",
  documents: "Documents",
  pages: "Pages",
  submissions: "Submissions",
  requests: "Requests",
  readiness: "Readiness",
  enrolments: "Enrolments",
  facilitators: "Facilitators",
};
