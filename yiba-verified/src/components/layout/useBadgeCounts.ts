"use client";

import useSWR from "swr";
import type { Role } from "@/lib/rbac";

interface BadgeCounts {
  invites: number;
  announcements: number;
  errors: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch badge counts");
  const data = await res.json();
  return {
    invites: typeof data.invites === "number" ? data.invites : 0,
    announcements: typeof data.announcements === "number" ? data.announcements : 0,
    errors: typeof data.errors === "number" ? data.errors : 0,
  };
};

export function useBadgeCounts(role: Role, viewingAsRole: Role | null) {
  const shouldFetch = role === "PLATFORM_ADMIN" && !viewingAsRole;
  const { data } = useSWR<BadgeCounts>(
    shouldFetch ? "/api/navigation/badges" : null,
    fetcher,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: true,
      refreshInterval: 30000,
    }
  );

  return data ?? { invites: 0, announcements: 0, errors: 0 };
}
