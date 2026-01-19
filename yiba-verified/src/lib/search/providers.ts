// Search Providers for Global Search
// Each provider fetches live results from API endpoints

import type { Role } from "@/lib/rbac";
import {
  Building2,
  GraduationCap,
  Users,
  type LucideIcon,
} from "lucide-react";

export type SearchProviderResult = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: LucideIcon;
  group: "Pages" | "Institutions" | "Learners" | "Users" | "Submissions" | "Requests" | "Documents";
  badge?: string;
};

/**
 * Search Institutions (PLATFORM_ADMIN only)
 */
export async function searchInstitutions(
  query: string,
  role: Role,
  signal?: AbortSignal
): Promise<SearchProviderResult[]> {
  if (role !== "PLATFORM_ADMIN" || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/platform-admin/institutions?q=${encodeURIComponent(query)}&limit=10`,
      { signal }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const institutions = data.items || [];

    return institutions.map((inst: any) => ({
      id: `institution-${inst.institution_id}`,
      title: inst.trading_name || inst.legal_name,
      subtitle: inst.legal_name !== inst.trading_name ? inst.legal_name : undefined,
      href: `/platform-admin/institutions/${inst.institution_id}`,
      icon: Building2,
      group: "Institutions" as const,
      badge: inst.province || inst.status,
    }));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return [];
    }
    console.error("Failed to search institutions:", error);
    return [];
  }
}

/**
 * Search Learners
 */
export async function searchLearners(
  query: string,
  role: Role,
  signal?: AbortSignal
): Promise<SearchProviderResult[]> {
  if (query.length < 2) {
    return [];
  }

  try {
    let url = "";
    
    if (role === "PLATFORM_ADMIN") {
      // Use platform-admin endpoint - allow search without institution_id when q is provided
      url = `/api/platform-admin/learners?q=${encodeURIComponent(query)}&limit=20`;
    } else if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") {
      // Institution roles use regular endpoint (server scopes to their institution)
      url = `/api/learners?q=${encodeURIComponent(query)}&limit=10`;
    } else if (role === "QCTO_USER") {
      // QCTO can search learners from approved submissions/requests
      url = `/api/learners?q=${encodeURIComponent(query)}&limit=10`;
    } else {
      // STUDENT and others - no learner search
      return [];
    }

    const response = await fetch(url, { signal });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const learners = data.items || [];

    return learners.map((learner: any) => ({
      id: `learner-${learner.learner_id}`,
      title: `${learner.first_name} ${learner.last_name}`,
      subtitle: learner.national_id,
      href: role === "PLATFORM_ADMIN" 
        ? `/platform-admin/learners/${learner.learner_id}`
        : `/institution/learners/${learner.learner_id}`,
      icon: GraduationCap,
      group: "Learners" as const,
      badge: learner.institution?.trading_name || learner.institution?.legal_name || "Institution",
    }));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return [];
    }
    console.error("Failed to search learners:", error);
    return [];
  }
}

/**
 * Search Users (PLATFORM_ADMIN only)
 */
export async function searchUsers(
  query: string,
  role: Role,
  signal?: AbortSignal
): Promise<SearchProviderResult[]> {
  if (role !== "PLATFORM_ADMIN" || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/platform-admin/users?q=${encodeURIComponent(query)}&limit=10`,
      { signal }
    );

    if (!response.ok) {
      // If endpoint doesn't exist, return empty (graceful degradation)
      return [];
    }

    const data = await response.json();
    const users = data.items || [];

    return users.map((user: any) => ({
      id: `user-${user.user_id}`,
      title: user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.email,
      subtitle: user.email,
      href: `/platform-admin/users/${user.user_id}`,
      icon: Users,
      group: "Users" as const,
      badge: user.role?.replace("_", " ") || "User",
    }));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return [];
    }
    // Gracefully handle missing endpoint
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    console.error("Failed to search users:", error);
    return [];
  }
}

/**
 * All search providers
 */
export const SEARCH_PROVIDERS = {
  institutions: searchInstitutions,
  learners: searchLearners,
  users: searchUsers,
};
