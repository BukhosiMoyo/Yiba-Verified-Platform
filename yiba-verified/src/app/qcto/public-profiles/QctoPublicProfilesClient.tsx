"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Globe, ExternalLink, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";

type Profile = {
  id: string;
  institution_id: string;
  slug: string;
  is_public: boolean;
  verification_status: string;
  verified_at: string | null;
  institution: { institution_id: string; legal_name: string; trading_name: string | null; province: string };
};

type Post = {
  id: string;
  type: string;
  title: string;
  body: string;
  is_verified: boolean;
  created_at: string;
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-ZA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(d));
}

export function QctoPublicProfilesClient() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [postsOpen, setPostsOpen] = useState<{ profileId: string; name: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postVerifyingId, setPostVerifyingId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/qcto/public-profiles");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to fetch public profiles");
      }
      const data = await res.json();
      setProfiles(data.items ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleVerifyProfile = async (profileId: string, verification_status: "PENDING" | "VERIFIED") => {
    setVerifyingId(profileId);
    try {
      const res = await fetch(`/api/qcto/public-profiles/${profileId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update");
      }
      await fetchProfiles();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setVerifyingId(null);
    }
  };

  const openPosts = async (profileId: string, name: string) => {
    setPostsOpen({ profileId, name });
    setPostsLoading(true);
    setPosts([]);
    try {
      const res = await fetch(`/api/qcto/public-profiles/${profileId}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.items ?? []);
      }
    } finally {
      setPostsLoading(false);
    }
  };

  const handleVerifyPost = async (postId: string, is_verified: boolean) => {
    setPostVerifyingId(postId);
    try {
      const res = await fetch(`/api/qcto/posts/${postId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update");
      }
      if (postsOpen) {
        const data = await fetch(`/api/qcto/public-profiles/${postsOpen.profileId}/posts`).then((r) => r.json());
        setPosts(data.items ?? []);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setPostVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 text-muted-foreground">Loading public profiles…</div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 text-destructive">{error}</div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          title="No public profiles"
          description="Institution public profiles will appear here when they exist."
          variant="no-results"
        />
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Institution</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Province</th>
              <th className="px-4 py-3 text-left font-medium">Public</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  {p.institution.trading_name || p.institution.legal_name}
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs">{p.slug}</code>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.institution.province}</td>
                <td className="px-4 py-3">
                  {p.is_public ? (
                    <Badge variant="default" className="text-xs">Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">No</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.verification_status === "VERIFIED" && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                  {p.verification_status === "PENDING" && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Clock className="h-3 w-3" /> Pending
                    </Badge>
                  )}
                  {p.verification_status === "UNVERIFIED" && (
                    <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                      <XCircle className="h-3 w-3" /> Unverified
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Select
                      value={p.verification_status === "UNVERIFIED" ? "PENDING" : p.verification_status}
                      onValueChange={(v) => handleVerifyProfile(p.id, v as "PENDING" | "VERIFIED")}
                      disabled={verifyingId === p.id}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="VERIFIED">Verified</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPosts(p.id, p.institution.trading_name || p.institution.legal_name)}
                    >
                      <FileText className="h-4 w-4 mr-1" /> Posts
                    </Button>
                    {p.is_public && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/institutions/${p.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!postsOpen} onOpenChange={(open) => !open && setPostsOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Posts — {postsOpen?.name ?? ""}</DialogTitle>
          </DialogHeader>
          {postsLoading ? (
            <p className="text-sm text-muted-foreground">Loading posts…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet.</p>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post.id} className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{post.title}</span>
                      <Badge variant={post.type === "ACHIEVEMENT" ? "default" : "secondary"} className="text-xs">
                        {post.type}
                      </Badge>
                      {post.is_verified ? (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Unverified</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(post.created_at)}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.body}</p>
                  </div>
                  <Select
                    value={post.is_verified ? "verified" : "unverified"}
                    onValueChange={(v) => handleVerifyPost(post.id, v === "verified")}
                    disabled={postVerifyingId === post.id}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
