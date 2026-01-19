// UI permission wrapper
// React component for conditional rendering based on user permissions
"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { hasCap, type Capability } from "@/lib/capabilities";
import type { Role } from "@/lib/rbac";

export function Can({ cap, children }: { cap: Capability; children: ReactNode }) {
  const { data } = useSession();
  const role = (data as any)?.role as Role | undefined;

  if (!role) return null;
  if (!hasCap(role, cap)) return null;
  return <>{children}</>;
}