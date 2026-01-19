"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Settings, Search as SearchIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/rbac";
import {
  getSearchableItems,
  searchItems,
  groupResults,
  CATEGORY_LABELS,
  type SearchResult,
} from "@/lib/search/index";
import {
  searchInstitutions,
  searchLearners,
  searchUsers,
  type SearchProviderResult,
} from "@/lib/search/providers";

type GlobalSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
};

type CategoryFilter = "mixed" | "institutions" | "learners" | "users" | "audit-logs" | "documents";

export function GlobalSearch({ open, onOpenChange, role }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("mixed");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [apiResults, setApiResults] = useState<SearchProviderResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());

  // Get all searchable items for this role (pages/navigation)
  const allPageItems = useMemo(() => getSearchableItems(role), [role]);

  // Debounced API search
  useEffect(() => {
    if (!open) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Only search if query is at least 2 characters
    if (query.length < 2) {
      setApiResults([]);
      setIsLoading(false);
      setLoadingGroups(new Set());
      return;
    }

    // Create new AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    const loadingSet = new Set<string>();

    // Determine which providers to call based on role and category
    const providers: Array<{ name: string; fn: () => Promise<SearchProviderResult[]> }> = [];

    if (activeCategory === "mixed" || activeCategory === "institutions") {
      if (role === "PLATFORM_ADMIN") {
        loadingSet.add("Institutions");
        providers.push({
          name: "Institutions",
          fn: () => searchInstitutions(query, role, abortController.signal),
        });
      }
    }

    if (activeCategory === "mixed" || activeCategory === "learners") {
      // Learners search available for most roles
      if (role === "PLATFORM_ADMIN" || role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF" || role === "QCTO_USER") {
        loadingSet.add("Learners");
        providers.push({
          name: "Learners",
          fn: () => searchLearners(query, role, abortController.signal),
        });
      }
    }

    // Phase 2: Users search disabled (only Institutions + Learners)
    // if (activeCategory === "mixed" || activeCategory === "users") {
    //   if (role === "PLATFORM_ADMIN") {
    //     loadingSet.add("Users");
    //     providers.push({
    //       name: "Users",
    //       fn: () => searchUsers(query, role, abortController.signal),
    //     });
    //   }
    // }

    setLoadingGroups(loadingSet);

    // Debounce: wait 300ms before making API calls
    const timeoutId = setTimeout(async () => {
      try {
        const results = await Promise.all(providers.map((p) => p.fn()));
        const allResults = results.flat();

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        setApiResults(allResults);
        setIsLoading(false);
        setLoadingGroups(new Set());
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return; // Request was cancelled, ignore
        }
        console.error("Search error:", error);
        setIsLoading(false);
        setLoadingGroups(new Set());
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query, role, activeCategory, open]);

  // Merge page results with API results
  const allResults = useMemo(() => {
    // Get page results (filtered by query and category)
    const pageResults = searchItems(
      allPageItems,
      query,
      activeCategory === "mixed" ? undefined : activeCategory
    );

    // Convert page results to SearchProviderResult format
    const pageResultsFormatted: SearchProviderResult[] = pageResults.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      href: item.href,
      icon: item.icon,
      group: item.category === "pages" ? "Pages" : 
             item.category === "institutions" ? "Institutions" :
             item.category === "learners" ? "Learners" :
             item.category === "users" ? "Users" :
             item.category === "audit-logs" ? "Audit Logs" :
             item.category === "documents" ? "Documents" :
             item.category === "submissions" ? "Submissions" :
             item.category === "requests" ? "Requests" :
             item.category === "readiness" ? "Readiness" :
             item.category === "enrolments" ? "Enrolments" : "Pages",
    }));

    // Filter API results by category if not mixed
    let filteredApiResults = apiResults;
    if (activeCategory !== "mixed") {
      filteredApiResults = apiResults.filter((result) => {
        const categoryMap: Record<CategoryFilter, string> = {
          mixed: "",
          institutions: "Institutions",
          learners: "Learners",
          users: "Users",
          "audit-logs": "Audit Logs",
          documents: "Documents",
        };
        return result.group === categoryMap[activeCategory];
      });
    }

    // Merge and deduplicate by href
    const merged = [...pageResultsFormatted, ...filteredApiResults];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.href)) {
        return false;
      }
      seen.add(item.href);
      return true;
    });
  }, [allPageItems, query, activeCategory, apiResults]);

  // Group results with priority order
  const groupedResults = useMemo(() => {
    const grouped: Record<string, SearchProviderResult[]> = {};
    const groupOrder = ["Pages", "Institutions", "Learners", "Users", "Submissions", "Requests", "Documents", "Audit Logs"];
    
    allResults.forEach((result) => {
      if (!grouped[result.group]) {
        grouped[result.group] = [];
      }
      grouped[result.group].push(result);
    });

    // Sort groups by priority order
    const sorted: Record<string, SearchProviderResult[]> = {};
    groupOrder.forEach((group) => {
      if (grouped[group]) {
        sorted[group] = grouped[group];
      }
    });
    // Add any remaining groups not in the priority list
    Object.keys(grouped).forEach((group) => {
      if (!sorted[group]) {
        sorted[group] = grouped[group];
      }
    });

    return sorted;
  }, [allResults]);

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    return allResults;
  }, [allResults]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveCategory("mixed");
      setSelectedIndex(0);
      setApiResults([]);
      setIsLoading(false);
      setLoadingGroups(new Set());
      // Focus input after a brief delay to ensure dialog is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Cancel any pending requests when dialog closes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setApiResults([]);
      setIsLoading(false);
      setLoadingGroups(new Set());
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          router.push(flatResults[selectedIndex].href);
          onOpenChange(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, flatResults, selectedIndex, router, onOpenChange]);

  // Available categories based on role and API capabilities
  const availableCategories: CategoryFilter[] = useMemo(() => {
    const categories = new Set<CategoryFilter>(["mixed"]);
    
    // Add categories from page items
    allPageItems.forEach((item) => {
      const cat = item.category;
      if (cat === "institutions" || cat === "learners" || cat === "users" || cat === "audit-logs" || cat === "documents") {
        categories.add(cat as CategoryFilter);
      }
    });

    // Add categories based on role capabilities
    if (role === "PLATFORM_ADMIN") {
      categories.add("institutions");
      categories.add("users");
    }
    if (role === "PLATFORM_ADMIN" || role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF" || role === "QCTO_USER") {
      categories.add("learners");
    }

    // Sort: mixed first, then alphabetically
    return ["mixed", ...Array.from(categories).filter(c => c !== "mixed").sort()] as CategoryFilter[];
  }, [allPageItems, role]);

  const handleResultClick = (result: SearchProviderResult) => {
    router.push(result.href);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
      <DialogContent className="max-w-[720px] p-0 gap-0 rounded-xl border border-gray-200/60 bg-white shadow-xl">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        {/* Search Input */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100/60">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="h-11 pl-11 pr-4 text-base border-gray-200/80 bg-gray-50/50 rounded-lg focus:bg-white focus:border-gray-300 transition-all duration-200"
            />
          </div>
        </div>

        {/* Tabs Row */}
        <div className="px-6 py-3 border-b border-gray-100/60 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setSelectedIndex(0);
                }}
                className={cn(
                  "px-1 py-2 text-sm font-medium transition-colors duration-200 relative",
                  activeCategory === category
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {CATEGORY_LABELS[category] || category}
                {activeCategory === category && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Results */}
        <div className="max-h-[480px] overflow-y-auto px-2 py-4">
          {allResults.length === 0 && !isLoading && query.length >= 2 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <SearchIcon className="h-12 w-12 text-gray-300 mb-4" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-900 mb-1">No results found</p>
              <p className="text-xs text-gray-500">Try a different search term</p>
            </div>
          ) : allResults.length === 0 && query.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <SearchIcon className="h-12 w-12 text-gray-300 mb-4" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-900 mb-1">Start typing to search</p>
              <p className="text-xs text-gray-500">Search pages, institutions, learners, and more</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedResults).map(([group, results]) => {
                const isGroupLoading = loadingGroups.has(group);
                // Group label is already correct
                const groupLabel = group;
                
                return (
                  <div key={group} className="space-y-1">
                    <div className="px-4 py-2 flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {groupLabel}
                      </h3>
                      {isGroupLoading && (
                        <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {results.map((result) => {
                        const flatIndex = flatResults.indexOf(result);
                        const isSelected = flatIndex === selectedIndex;
                        const Icon = result.icon;

                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-150 text-left",
                              isSelected
                                ? "bg-blue-50 text-gray-900"
                                : "hover:bg-gray-50/80 text-gray-700"
                            )}
                            onMouseEnter={() => setSelectedIndex(flatIndex)}
                          >
                            <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900">{result.title}</div>
                              {result.subtitle && (
                                <div className="text-xs text-gray-500 mt-0.5">{result.subtitle}</div>
                              )}
                            </div>
                            {result.badge && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 flex-shrink-0">
                                {result.badge}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-gray-100/60 bg-gray-50/30">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-xs font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-xs font-mono">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-xs font-mono">↵</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-xs font-mono">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
            <span>
              {isLoading ? "Searching..." : `${allResults.length} result${allResults.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
