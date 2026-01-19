"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface RemoveResourceButtonProps {
  submissionId: string;
  resourceId: string;
  resourceType: string;
  resourceIdValue: string;
}

/**
 * RemoveResourceButton Component
 * 
 * Client component for removing a resource from a submission.
 * Handles DELETE request to /api/institutions/submissions/[submissionId]/resources/[resourceId]
 */
export function RemoveResourceButton({ submissionId, resourceId, resourceType, resourceIdValue }: RemoveResourceButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/institutions/submissions/${submissionId}/resources/${resourceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove resource");
      }

      toast.success("Resource removed successfully");
      setOpen(false);
      
      // Refresh the page to show updated resources
      router.refresh();
    } catch (err: any) {
      toast.error(`Failed to remove resource: ${err.message || "An error occurred"}`);
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Resource</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{resourceType}</strong> (<code className="text-xs bg-muted px-1 py-0.5 rounded">{resourceIdValue}</code>) from this submission?
            <br />
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Removing..." : "Remove Resource"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
