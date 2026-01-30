"use client";

import { cn } from "@/lib/utils";
import { NOTIFICATION_CATEGORIES, type FilterOption } from "./types";

interface NotificationFiltersProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  unreadCount: number;
  categoryCounts?: Record<string, number>;
}

const FILTER_TABS: { id: FilterOption; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
];

export function NotificationFilters({
  activeFilter,
  onFilterChange,
  unreadCount,
  categoryCounts = {},
}: NotificationFiltersProps) {
  // Only show category tabs that have notifications
  const categoryTabs = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .slice(0, 4) // Max 4 category tabs
    .map(([category, count]) => ({
      id: category as FilterOption,
      label: NOTIFICATION_CATEGORIES[category]?.label || category,
      count,
    }));

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border/60 overflow-x-auto scrollbar-hide">
      {FILTER_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap",
            activeFilter === tab.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {tab.label}
          {tab.id === "unread" && unreadCount > 0 && (
            <span className="ml-1.5 text-xs">({unreadCount})</span>
          )}
        </button>
      ))}

      {/* Separator */}
      {categoryTabs.length > 0 && (
        <div className="h-4 w-px bg-border mx-1" />
      )}

      {/* Category tabs */}
      {categoryTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap",
            activeFilter === tab.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
