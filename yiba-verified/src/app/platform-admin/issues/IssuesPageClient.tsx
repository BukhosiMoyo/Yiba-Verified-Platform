"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bug,
  AlertCircle,
  Lock,
  Lightbulb,
  HelpCircle,
  Loader2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  User,
  Building2,
  MoreHorizontal,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  Send,
  MessageSquare,
  Heart,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface IssueAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  pageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reporter: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  institution: {
    id: string;
    name: string;
  } | null;
  assignee: {
    userId: string;
    name: string;
  } | null;
  attachmentCount: number;
  attachments?: IssueAttachment[];
}

const categoryIcons: Record<string, typeof Bug> = {
  BUG: Bug,
  DATA_ISSUE: AlertCircle,
  ACCESS_ISSUE: Lock,
  FEATURE_REQUEST: Lightbulb,
  OTHER: HelpCircle,
};

const categoryLabels: Record<string, string> = {
  BUG: "Bug",
  DATA_ISSUE: "Data Issue",
  ACCESS_ISSUE: "Access Issue",
  FEATURE_REQUEST: "Feature Request",
  OTHER: "Other",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  RESOLVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  CLOSED: "bg-muted text-muted-foreground border-border",
  WONT_FIX: "bg-red-500/10 text-red-600 border-red-500/20",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-500/10 text-blue-600",
  HIGH: "bg-amber-500/10 text-amber-600",
  URGENT: "bg-red-500/10 text-red-600",
};

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "WONT_FIX"] as const;

export function IssuesPageClient() {
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const initialStatus =
    statusFromUrl && VALID_STATUSES.includes(statusFromUrl as (typeof VALID_STATUSES)[number])
      ? statusFromUrl
      : "all";

  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Response/notification state
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseIssue, setResponseIssue] = useState<Issue | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseType, setResponseType] = useState<"thank_you" | "acknowledged" | "custom">("thank_you");
  const [isSendingResponse, setIsSendingResponse] = useState(false);

  // Pre-defined response templates
  const responseTemplates = {
    thank_you: "Thank you for reporting this issue! We really appreciate you taking the time to help us improve the platform. Our team will look into this and work on a fix.",
    acknowledged: "We've received your report and our team is now aware of this issue. We'll investigate and update you on any progress. Thanks for bringing this to our attention!",
    custom: "",
  };

  // Handle sending response notification
  const handleSendResponse = async () => {
    if (!responseIssue || !responseMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSendingResponse(true);
    try {
      const res = await fetch(`/api/issues/${responseIssue.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: responseMessage.trim(),
          responseType,
        }),
      });

      if (res.ok) {
        toast.success("Response sent to reporter");
        setResponseDialogOpen(false);
        setResponseMessage("");
        setResponseIssue(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send response");
      }
    } catch (error) {
      console.error("Failed to send response:", error);
      toast.error("Failed to send response");
    } finally {
      setIsSendingResponse(false);
    }
  };

  // Open response dialog
  const openResponseDialog = (issue: Issue) => {
    setResponseIssue(issue);
    setResponseType("thank_you");
    setResponseMessage(responseTemplates.thank_you);
    setResponseDialogOpen(true);
  };

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);

      const res = await fetch(`/api/issues?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      toast.error("Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter]);

  // Sync status filter from URL when sidebar links are used
  useEffect(() => {
    const urlStatus = searchParams.get("status");
    const next =
      urlStatus && VALID_STATUSES.includes(urlStatus as (typeof VALID_STATUSES)[number])
        ? urlStatus
        : "all";
    setStatusFilter(next);
  }, [searchParams]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Filter by search
  const filteredIssues = issues.filter((issue) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      issue.title.toLowerCase().includes(query) ||
      issue.reporter.name.toLowerCase().includes(query) ||
      issue.reporter.email.toLowerCase().includes(query)
    );
  });

  // Update issue status
  const handleUpdateStatus = async (issueId: string, status: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success("Issue updated");
        fetchIssues();
        setSelectedIssue(null);
      } else {
        toast.error("Failed to update issue");
      }
    } catch (error) {
      console.error("Failed to update issue:", error);
      toast.error("Failed to update issue");
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Issue Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage bug reports and feedback from users
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
            <SelectItem value="WONT_FIX">Won't Fix</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="BUG">Bug</SelectItem>
            <SelectItem value="DATA_ISSUE">Data Issue</SelectItem>
            <SelectItem value="ACCESS_ISSUE">Access Issue</SelectItem>
            <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues table */}
      <div className="rounded-lg overflow-hidden border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bug className="h-12 w-12 text-muted-foreground/50 mb-3" strokeWidth={1} />
            <p className="text-sm font-medium text-muted-foreground">
              No issues found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Issue</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => {
                const CategoryIcon = categoryIcons[issue.category] || HelpCircle;
                return (
                  <TableRow
                    key={issue.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <CategoryIcon
                            className="h-4 w-4 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {issue.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabels[issue.category]}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {issue.reporter.name}
                          </p>
                          {issue.institution && (
                            <p className="text-xs text-muted-foreground truncate">
                              {issue.institution.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", statusColors[issue.status])}
                      >
                        {issue.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", priorityColors[issue.priority])}
                      >
                        {issue.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(issue.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIssue(issue);
                            }}
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openResponseDialog(issue);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Response
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(issue.id, "IN_PROGRESS");
                            }}
                          >
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(issue.id, "RESOLVED");
                            }}
                          >
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(issue.id, "CLOSED");
                            }}
                          >
                            Close
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      {/* Issue detail dialog */}
      <Dialog
        open={!!selectedIssue}
        onOpenChange={(open) => !open && setSelectedIssue(null)}
      >
        {selectedIssue && (
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = categoryIcons[selectedIssue.category] || HelpCircle;
                  return <Icon className="h-5 w-5" strokeWidth={1.5} />;
                })()}
                {selectedIssue.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status and priority */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(statusColors[selectedIssue.status])}
                >
                  {selectedIssue.status.replace("_", " ")}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(priorityColors[selectedIssue.priority])}
                >
                  {selectedIssue.priority}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(selectedIssue.createdAt)}
                </span>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                  {selectedIssue.description}
                </p>
              </div>

              {/* Page URL */}
              {selectedIssue.pageUrl && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Page URL</Label>
                  <a
                    href={selectedIssue.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {selectedIssue.pageUrl}
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Attachments */}
              {selectedIssue.attachments && selectedIssue.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attachments ({selectedIssue.attachments.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedIssue.attachments.map((attachment) => {
                      const isImage = attachment.fileType.startsWith("image/");
                      return (
                        <a
                          key={attachment.id}
                          href={attachment.storageKey}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative border rounded-lg overflow-hidden bg-muted hover:border-primary/50 transition-colors"
                        >
                          {isImage ? (
                            <img
                              src={attachment.storageKey}
                              alt={attachment.fileName}
                              className="h-24 w-24 object-cover"
                            />
                          ) : (
                            <div className="h-24 w-24 flex flex-col items-center justify-center p-2">
                              <FileText className="h-8 w-8 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground truncate w-full text-center">
                                {attachment.fileName.length > 12
                                  ? `${attachment.fileName.slice(0, 12)}...`
                                  : attachment.fileName}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Download className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 text-center truncate">
                            {formatFileSize(attachment.fileSize)}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reporter */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Reported by</Label>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedIssue.reporter.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedIssue.reporter.email} • {selectedIssue.reporter.role}
                    </p>
                  </div>
                  {selectedIssue.institution && (
                    <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {selectedIssue.institution.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Select
                  value={selectedIssue.status}
                  onValueChange={(status) => handleUpdateStatus(selectedIssue.id, status)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="WONT_FIX">Won't Fix</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedIssue.priority}
                  onValueChange={(priority) => {
                    fetch(`/api/issues/${selectedIssue.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ priority }),
                    }).then(() => {
                      toast.success("Priority updated");
                      fetchIssues();
                    });
                  }}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="default"
                  onClick={() => {
                    setSelectedIssue(null);
                    openResponseDialog(selectedIssue);
                  }}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Send Thanks
                </Button>

                <Button
                  variant="outline"
                  className="ml-auto"
                  onClick={() => setSelectedIssue(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Response/Thank you dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Send Response to Reporter
            </DialogTitle>
          </DialogHeader>

          {responseIssue && (
            <div className="space-y-4">
              {/* Issue reference */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-foreground">
                  Re: {responseIssue.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reported by {responseIssue.reporter.name} ({responseIssue.reporter.email})
                </p>
              </div>

              {/* Quick response templates */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Quick Templates</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={responseType === "thank_you" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setResponseType("thank_you");
                      setResponseMessage(responseTemplates.thank_you);
                    }}
                  >
                    <Heart className="h-3.5 w-3.5 mr-1.5" />
                    Thank You
                  </Button>
                  <Button
                    variant={responseType === "acknowledged" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setResponseType("acknowledged");
                      setResponseMessage(responseTemplates.acknowledged);
                    }}
                  >
                    <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                    Acknowledged
                  </Button>
                  <Button
                    variant={responseType === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setResponseType("custom");
                      setResponseMessage("");
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Custom
                  </Button>
                </div>
              </div>

              {/* Message input */}
              <div className="space-y-2">
                <Label htmlFor="response-message">Message</Label>
                <Textarea
                  id="response-message"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Write your message to the reporter..."
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This message will be sent as a notification to the reporter.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setResponseDialogOpen(false)}
                  disabled={isSendingResponse}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendResponse}
                  disabled={!responseMessage.trim() || isSendingResponse}
                >
                  {isSendingResponse ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
