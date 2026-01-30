"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Pencil,
  Download,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type ProfileFloatingActionsProps = {
  cvId: string;
  onDownload: () => void;
  onShare: () => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  className?: string;
};

const icons = "h-4 w-4" as const;

export function ProfileFloatingActions({
  cvId,
  onDownload,
  onShare,
  onDelete,
  canDelete = true,
  className,
}: ProfileFloatingActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDeleteClick = () => {
    if (!canDelete) return;
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete?.(cvId);
    setDeleteOpen(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex flex-col gap-1 rounded-lg border border-[var(--border-strong)] bg-card/95 p-1.5 shadow-[var(--shadow-card)] ring-1 ring-primary/5 backdrop-blur-sm transition-shadow duration-200",
          "sticky top-24",
          className
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center justify-center rounded-md bg-primary/10 p-1.5 text-primary" aria-hidden>
              <Eye className={icons} strokeWidth={1.5} />
            </span>
          </TooltipTrigger>
          <TooltipContent side="left">View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-md" asChild>
              <Link href={`/student/profile/edit/${cvId}`} aria-label="Edit CV">
                <Pencil className={icons} strokeWidth={1.5} />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Edit CV</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-md"
              onClick={onDownload}
              aria-label="Download CV"
            >
              <Download className={icons} strokeWidth={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Download CV</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-md"
              onClick={onShare}
              aria-label="Share Profile"
            >
              <Share2 className={icons} strokeWidth={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Share Profile</TooltipContent>
        </Tooltip>

        {canDelete && onDelete && (
          <>
            <div className="my-0.5 h-px bg-[var(--border-strong)]" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDeleteClick}
                  aria-label="Delete CV"
                >
                  <Trash2 className={icons} strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Delete CV</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this CV?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The CV version will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
