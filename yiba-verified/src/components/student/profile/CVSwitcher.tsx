"use client";

import { ChevronLeft, ChevronRight, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CVVersionRow } from "@/components/student/StudentCVVersionsTable";

export type CVSwitcherProps = {
  rows: CVVersionRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew?: () => void;
  /** When false, carousel only (no Create New CV). Use when top bar has its own Create button. */
  showCreateButton?: boolean;
  /** Optional compact thumbnail render for each CV. Default: name + targetRole. */
  renderThumb?: (row: CVVersionRow, isSelected: boolean) => React.ReactNode;
};

const defaultThumb = (row: CVVersionRow, isSelected: boolean) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded-lg border px-4 py-3 text-center transition-all duration-200",
      "min-w-[140px] sm:min-w-[160px]",
      isSelected
        ? "border-primary bg-primary/15 ring-2 ring-primary/30 shadow-[var(--shadow-soft)]"
        : "border-[var(--border-strong)] bg-card hover:border-primary/40 hover:bg-primary/5"
    )}
  >
    <span className="text-sm font-medium text-foreground truncate w-full">{row.name}</span>
    <span className={cn("text-xs truncate w-full mt-0.5", isSelected ? "text-primary/90" : "text-foreground/80")}>{row.targetRole}</span>
  </div>
);

export function CVSwitcher({
  rows,
  selectedId,
  onSelect,
  onCreateNew,
  showCreateButton = true,
  renderThumb = defaultThumb,
}: CVSwitcherProps) {
  const index = selectedId ? rows.findIndex((r) => r.id === selectedId) : 0;
  const canPrev = index > 0;
  const canNext = index >= 0 && index < rows.length - 1;

  const goPrev = () => {
    if (!canPrev) return;
    onSelect(rows[index - 1].id);
  };

  const goNext = () => {
    if (!canNext) return;
    onSelect(rows[index + 1].id);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-[var(--border-strong)] hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-[var(--border-strong)] disabled:hover:text-muted-foreground"
          onClick={goPrev}
          disabled={!canPrev}
          aria-label="Previous CV"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </Button>
        <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin">
          {rows.map((row) => {
            const isSelected = selectedId === row.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelect(row.id)}
                className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
              >
                {renderThumb(row, isSelected)}
              </button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-[var(--border-strong)] hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-[var(--border-strong)] disabled:hover:text-muted-foreground"
          onClick={goNext}
          disabled={!canNext}
          aria-label="Next CV"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
      {showCreateButton && onCreateNew && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={onCreateNew}
        >
          <FilePlus className="h-4 w-4" strokeWidth={1.5} />
          Create New CV
        </Button>
      )}
    </div>
  );
}
