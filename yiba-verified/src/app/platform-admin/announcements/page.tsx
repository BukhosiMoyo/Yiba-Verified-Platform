"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Archive, Trash2, AlertCircle, Info, AlertTriangle, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

interface Announcement {
  announcement_id: string;
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "ACTIVE" | "ARCHIVED";
  created_by: {
    name: string;
    email: string;
  };
  expires_at: string | null;
  created_at: string;
  updated_at?: string;
}

const priorityConfig = {
  LOW: { label: "Low", icon: Info, className: "bg-blue-100 text-blue-700" },
  MEDIUM: { label: "Medium", icon: Bell, className: "bg-gray-100 text-gray-700" },
  HIGH: { label: "High", icon: AlertTriangle, className: "bg-amber-100 text-amber-700" },
  URGENT: { label: "Urgent", icon: AlertCircle, className: "bg-red-100 text-red-700" },
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      // Fetch all announcements (including archived) - we'll need to create this endpoint
      // For now, using the public endpoint and we'll add admin endpoint later
      const response = await fetch("/api/platform-admin/announcements");
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.items || []);
      } else if (response.status === 404) {
        // Endpoint doesn't exist yet, use public endpoint as fallback
        const publicResponse = await fetch("/api/announcements");
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          setAnnouncements(publicData.items || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setTitle("");
    setMessage("");
    setPriority("MEDIUM");
    setExpiresAt("");
    setError("");
    setIsDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setPriority(announcement.priority);
    setExpiresAt(announcement.expires_at ? announcement.expires_at.split("T")[0] : "");
    setError("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload: any = {
        title,
        message,
        priority,
      };

      if (expiresAt) {
        payload.expires_at = new Date(expiresAt).toISOString();
      }

      let response;
      if (editingAnnouncement) {
        // Update existing
        response = await fetch(`/api/announcements/${editingAnnouncement.announcement_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        response = await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast.success(editingAnnouncement ? "Announcement updated" : "Announcement created");
        setIsDialogOpen(false);
        fetchAnnouncements();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Failed to save announcement");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (announcementId: string) => {
    if (!confirm("Are you sure you want to archive this announcement?")) return;

    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });

      if (response.ok) {
        toast.success("Announcement archived");
        fetchAnnouncements();
      } else {
        toast.error("Failed to archive announcement");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Announcement deleted");
        fetchAnnouncements();
      } else {
        toast.error("Failed to delete announcement");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const activeAnnouncements = announcements.filter((a) => a.status === "ACTIVE");
  const archivedAnnouncements = announcements.filter((a) => a.status === "ARCHIVED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage system-wide announcements visible to all users
          </p>
        </div>
        <Button onClick={handleCreate} className="h-10">
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Active Announcements */}
          <Card>
            <CardHeader>
              <CardTitle>Active Announcements</CardTitle>
              <CardDescription>
                Currently visible to all users ({activeAnnouncements.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAnnouncements.length === 0 ? (
                <EmptyState
                  title="No active announcements"
                  description="Create an announcement to notify all users"
                />
              ) : (
                <div className="space-y-4">
                  {activeAnnouncements.map((announcement) => {
                    const config = priorityConfig[announcement.priority];
                    const Icon = config.icon;
                    return (
                      <div
                        key={announcement.announcement_id}
                        className="border border-gray-200 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                                <Badge className={config.className}>{config.label}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {announcement.message}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>Created by {announcement.created_by.name}</span>
                                <span>•</span>
                                <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                                {announcement.expires_at && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(announcement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(announcement.announcement_id)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(announcement.announcement_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Archived Announcements */}
          {archivedAnnouncements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Archived Announcements</CardTitle>
                <CardDescription>
                  No longer visible to users ({archivedAnnouncements.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {archivedAnnouncements.map((announcement) => {
                    const config = priorityConfig[announcement.priority];
                    const Icon = config.icon;
                    return (
                      <div
                        key={announcement.announcement_id}
                        className="border border-gray-200 rounded-lg p-4 space-y-3 opacity-60"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                                <Badge variant="outline">Archived</Badge>
                              </div>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {announcement.message}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(announcement.announcement_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription>
              Announcements will be visible to all users. Use priority to control visibility.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Announcement message"
                  rows={5}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as typeof priority)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires At (Optional)</Label>
                <DatePicker
                  id="expires_at"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">
                  Leave empty for announcements that don't expire
                </p>
              </div>
              {error && (
                <Alert variant="error" description={error} />
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingAnnouncement ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
