"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LayoutGrid, FileStack, Settings, Share2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { CVVersionRow } from "@/components/student/StudentCVVersionsTable";
import type { MockStudentSystem } from "@/components/student/StudentProfileClient";

export type ProfileSidebarProps = {
  cvVersions: CVVersionRow[];
  selectedCvId: string | null;
  onSelectCv: (id: string) => void;
  onCreateCv: () => void;
  system: MockStudentSystem;
  publicProfile: boolean;
  onCopyLink: () => void;
  isSaving?: boolean;
};

export function ProfileSidebar({
  cvVersions,
  selectedCvId,
  onSelectCv,
  onCreateCv,
  system,
  publicProfile,
  onCopyLink,
  isSaving = false,
}: ProfileSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--border-strong)] bg-card/90 transition-all duration-200",
        "shadow-[var(--shadow-soft)]",
        collapsed ? "w-12" : "w-64 min-w-[12rem]"
      )}
    >
      <div className="flex h-10 shrink-0 items-center justify-between gap-1 border-b border-[var(--border-strong)] bg-muted/20 px-2">
        {!collapsed && <span className="text-sm font-semibold text-foreground">Profile</span>}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          )}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {collapsed ? (
          <nav className="flex flex-col items-center gap-1 py-2">
            <IconLink icon={LayoutGrid} label="Overview" />
            <IconLink icon={FileStack} label="CV Versions" />
            <IconLink icon={Settings} label="Profile Settings" />
            <IconLink icon={Share2} label="Visibility & Sharing" />
            <IconLink icon={User} label="Account" />
          </nav>
        ) : (
          <Accordion type="multiple" defaultValue={["overview", "cv"]} className="w-full">
            <AccordionItem value="overview" className="border-b border-[var(--border-strong)] px-2">
              <AccordionTrigger className="py-3 text-xs font-semibold uppercase tracking-wider text-foreground hover:no-underline hover:bg-muted/30 rounded-md [&[data-state=open]>svg]:rotate-180">
                <span className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                  Overview
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0">
                <div className="rounded-lg bg-muted/40 border border-[var(--border-subtle)] p-2.5 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Status</span>
                    <Badge variant="success" className="text-xs">
                      {system.header.verifiedStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground">Qualifications</span>
                    <span className="font-medium text-foreground">{system.evidenceCounts.qualifications}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground">Evidence</span>
                    <span className="font-medium text-foreground">{system.evidenceCounts.evidenceItems}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cv" className="border-b border-[var(--border-strong)] px-2">
              <AccordionTrigger className="py-3 text-xs font-semibold uppercase tracking-wider text-foreground hover:no-underline hover:bg-muted/30 rounded-md [&[data-state=open]>svg]:rotate-180">
                <span className="flex items-center gap-2">
                  <FileStack className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                  CV Versions
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0">
                <ul className="rounded-lg bg-muted/40 border border-[var(--border-subtle)] p-2 space-y-1">
                  {cvVersions.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => onSelectCv(row.id)}
                        className={cn(
                          "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                          selectedCvId === row.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {row.name}
                      </button>
                    </li>
                  ))}
                  <li>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full justify-start gap-1.5"
                      onClick={onCreateCv}
                    >
                      <span className="text-base">+</span>
                      Create New CV
                    </Button>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="settings" className="border-b border-[var(--border-strong)] px-2">
              <AccordionTrigger className="py-3 text-xs font-semibold uppercase tracking-wider text-foreground hover:no-underline hover:bg-muted/30 rounded-md [&[data-state=open]>svg]:rotate-180">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                  Profile Settings
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0">
                <Link
                  href="/account/profile"
                  className="block rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  Account settings
                </Link>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="visibility" className="border-b border-[var(--border-strong)] px-2">
              <AccordionTrigger className="py-3 text-xs font-semibold uppercase tracking-wider text-foreground hover:no-underline hover:bg-muted/30 rounded-md [&[data-state=open]>svg]:rotate-180">
                <span className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                  Visibility & Sharing
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0">
                <div className="space-y-2">
                  {publicProfile ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={onCopyLink}
                      disabled={isSaving}
                    >
                      Copy link
                    </Button>
                  ) : (
                    <p className="text-xs text-foreground/80">
                      Enable public profile in the top bar to get a shareable link.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="account" className="border-b border-[var(--border-strong)] px-2">
              <AccordionTrigger className="py-3 text-xs font-semibold uppercase tracking-wider text-foreground hover:no-underline hover:bg-muted/30 rounded-md [&[data-state=open]>svg]:rotate-180">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                  Account
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0">
                <Link
                  href="/account/profile"
                  className="block rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  Profile & security
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </ScrollArea>
    </aside>
  );
}

function IconLink({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center py-1.5" title={label}>
      <Icon className="h-4 w-4 text-foreground transition-colors hover:text-primary" strokeWidth={1.5} aria-label={label} />
    </div>
  );
}
