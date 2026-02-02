import {
  FileText,
  MessageSquare,
  ClipboardCheck,
  FileWarning,
  Users,
  GraduationCap,
  AlertCircle,
  Clock,
  Bell,
  CheckCircle,
  XCircle,
  Send,
  UserPlus,
  Calendar,
  Shield,
  type LucideIcon,
} from "lucide-react";

// Notification data structure
export interface Notification {
  notification_id: string;
  notification_type: string;
  category?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url?: string | null;
  is_read: boolean;
  is_archived?: boolean;
  read_at: string | null;
  created_at: string;
}

// Announcement data structure
export interface Announcement {
  announcement_id: string;
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  created_by_name?: string;
  created_by?: { name: string };
  created_at: string;
  expires_at: string | null;
}

// Category configuration
export interface CategoryConfig {
  icon: LucideIcon;
  label: string;
  bgLight: string;
  bgDark: string;
  text: string;
  iconBg: string;
}

export const NOTIFICATION_CATEGORIES: Record<string, CategoryConfig> = {
  submission: {
    icon: FileText,
    label: "Submissions",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
  },
  request: {
    icon: MessageSquare,
    label: "Requests",
    bgLight: "bg-purple-50",
    bgDark: "dark:bg-purple-950/30",
    text: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
  },
  readiness: {
    icon: ClipboardCheck,
    label: "Readiness",
    bgLight: "bg-green-50",
    bgDark: "dark:bg-green-950/30",
    text: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900/50",
  },
  document: {
    icon: FileWarning,
    label: "Documents",
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
  },
  team: {
    icon: Users,
    label: "Team",
    bgLight: "bg-indigo-50",
    bgDark: "dark:bg-indigo-950/30",
    text: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
  },
  student: {
    icon: GraduationCap,
    label: "Students",
    bgLight: "bg-teal-50",
    bgDark: "dark:bg-teal-950/30",
    text: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-100 dark:bg-teal-900/50",
  },
  system: {
    icon: AlertCircle,
    label: "System",
    bgLight: "bg-red-50",
    bgDark: "dark:bg-red-950/30",
    text: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/50",
  },
  deadline: {
    icon: Clock,
    label: "Deadlines",
    bgLight: "bg-orange-50",
    bgDark: "dark:bg-orange-950/30",
    text: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/50",
  },
  invite: {
    icon: UserPlus,
    label: "Invites",
    bgLight: "bg-cyan-50",
    bgDark: "dark:bg-cyan-950/30",
    text: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
  },
  default: {
    icon: Bell,
    label: "General",
    bgLight: "bg-gray-50",
    bgDark: "dark:bg-gray-900/30",
    text: "text-gray-600 dark:text-gray-400",
    iconBg: "bg-gray-100 dark:bg-gray-800",
  },
};

// Priority configuration
export const PRIORITY_CONFIG = {
  LOW: {
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    label: "Low",
  },
  NORMAL: {
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    label: "Normal",
  },
  HIGH: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    label: "High",
  },
  CRITICAL: {
    dot: "bg-red-500 animate-pulse",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    label: "Critical",
  },
};


// Map notification types to categories
export function getCategoryFromType(type: string): string {
  const typeToCategory: Record<string, string> = {
    // Submissions
    SUBMISSION_RECEIVED: "submission",
    SUBMISSION_REVIEWED: "submission",
    SUBMISSION_APPROVED: "submission",
    SUBMISSION_REJECTED: "submission",
    SUBMISSION_RETURNED: "submission",
    SUBMISSION_ASSIGNED: "submission",

    // Requests
    REQUEST_RECEIVED: "request",
    REQUEST_APPROVED: "request",
    REQUEST_REJECTED: "request",
    REQUEST_EXPIRED: "request",

    // Readiness
    READINESS_SUBMITTED: "readiness",
    READINESS_REVIEWED: "readiness",
    READINESS_RECOMMENDED: "readiness",
    READINESS_REJECTED: "readiness",
    READINESS_RETURNED: "readiness",

    // Documents
    DOCUMENT_FLAGGED: "document",
    DOCUMENT_UNFLAGGED: "document",
    DOCUMENT_REQUIRED: "document",

    // Evidence
    EVIDENCE_FLAGGED: "document",
    EVIDENCE_RESOLVED: "document",

    // Invites
    INVITE_ACCEPTED: "invite",
    INVITE_EXPIRED: "invite",
    BULK_INVITE_COMPLETED: "invite",

    // Team
    TEAM_MEMBER_JOINED: "team",
    TEAM_MEMBER_LEFT: "team",

    // Assignments
    REVIEW_ASSIGNED: "deadline",
    AUDIT_ASSIGNED: "deadline",
    TASK_ASSIGNED: "deadline",

    // Students
    ENROLMENT_CONFIRMED: "student",
    ASSESSMENT_RESULTS: "student",
    CERTIFICATE_READY: "student",
    ATTENDANCE_ALERT: "student",

    // Deadlines
    DEADLINE_APPROACHING: "deadline",
    DEADLINE_PASSED: "deadline",
    EXPIRATION_WARNING: "deadline",

    // System
    SYSTEM_ALERT: "system",
    SYSTEM_MAINTENANCE: "system",
    ANNOUNCEMENT: "system",
    ISSUE_RESPONSE: "system",
    INSTITUTION_CREATED: "system",
  };

  return typeToCategory[type] || "default";
}

// Role type for link routing (institution vs QCTO paths)
export type ViewerRoleForLink =
  | "PLATFORM_ADMIN"
  | "QCTO_USER"
  | "QCTO_SUPER_ADMIN"
  | "QCTO_ADMIN"
  | "QCTO_REVIEWER"
  | "QCTO_AUDITOR"
  | "QCTO_VIEWER"
  | "INSTITUTION_ADMIN"
  | "INSTITUTION_STAFF"
  | "STUDENT";

const QCTO_ROLES: ViewerRoleForLink[] = [
  "QCTO_USER",
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
];

function isQctoRole(role?: string | null): boolean {
  return role != null && QCTO_ROLES.includes(role as ViewerRoleForLink);
}

// Get navigation link for notification (role-aware: QCTO users get /qcto/... links)
export function getNotificationLink(
  notification: Notification,
  viewerRole?: string | null
): string | null {
  if (notification.action_url) return notification.action_url;
  if (!notification.entity_type || !notification.entity_id) return null;

  const id = notification.entity_id;
  const useQctoPaths = isQctoRole(viewerRole);

  switch (notification.entity_type) {
    case "SUBMISSION":
      return useQctoPaths ? `/qcto/submissions` : `/institution/submissions/${id}`;
    case "QCTO_REQUEST":
      return useQctoPaths ? `/qcto/requests/${id}` : `/institution/requests/${id}`;
    case "READINESS":
      return useQctoPaths ? `/qcto/readiness/${id}` : `/institution/readiness/${id}`;
    case "DOCUMENT":
      return useQctoPaths ? `/qcto/evidence-flags` : `/institution/documents/${id}`;
    case "ENROLMENT":
      return useQctoPaths ? `/qcto/enrolments/${id}` : `/institution/enrolments/${id}`;
    case "LEARNER":
      return useQctoPaths ? `/qcto/learners/${id}` : `/institution/learners/${id}`;
    case "ISSUE_REPORT":
      return "/notifications";
    case "INSTITUTION":
      return useQctoPaths ? `/platform-admin/institutions/${id}` : `/institution/staff`;
    default:
      return null;
  }
}

// Format time ago
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
}

// Group notifications by date
export function groupNotificationsByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let group: string;
    if (dateOnly.getTime() === today.getTime()) {
      group = "Today";
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      group = "Yesterday";
    } else if (dateOnly.getTime() > weekAgo.getTime()) {
      group = "This Week";
    } else {
      group = "Older";
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(notification);
  });

  return groups;
}

// Filter options
export type FilterOption = "all" | "unread" | string;
