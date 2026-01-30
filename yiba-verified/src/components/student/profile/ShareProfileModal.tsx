"use client";

import { Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export type ShareProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicProfile: boolean;
  onPublicProfileChange: (checked: boolean) => void;
  profileUrl: string;
  onCopyLink: () => void;
  isSaving?: boolean;
};

export function ShareProfileModal({
  open,
  onOpenChange,
  publicProfile,
  onPublicProfileChange,
  profileUrl,
  onCopyLink,
  isSaving = false,
}: ShareProfileModalProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Public profile</p>
              <p className="text-xs text-foreground/80 mt-0.5">
                Anyone with the link can view your public profile.
              </p>
            </div>
            <Switch
              checked={publicProfile}
              onCheckedChange={onPublicProfileChange}
              disabled={isSaving}
              aria-label="Public profile"
            />
          </div>
          {publicProfile ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Profile URL</p>
              <div className="flex gap-2">
                <code className="flex-1 rounded-lg border border-[var(--border-strong)] bg-muted/60 px-3 py-2 text-xs text-foreground truncate">
                  {profileUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-9 w-9 border-[var(--border-strong)] hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors"
                  onClick={onCopyLink}
                  aria-label="Copy link"
                >
                  <Copy className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
              <Button variant="outline" size="sm" className="w-full border-[var(--border-strong)] hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors" onClick={onCopyLink}>
                Copy link
              </Button>
            </div>
          ) : (
            <p className="text-sm text-foreground/80">
              Enable public profile to get a shareable link.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
