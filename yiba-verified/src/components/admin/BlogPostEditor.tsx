"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor, TiptapPreview } from "./TiptapEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Save,
  Eye,
  ArrowLeft,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface PostData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: "DRAFT" | "PUBLISHED";
  readingTime: number | null;
  categoryIds: string[];
  tagIds: string[];
}

interface BlogPostEditorProps {
  categories: Category[];
  tags: Tag[];
  mode: "create" | "edit";
  initialData?: PostData;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function estimateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function BlogPostEditor({
  categories,
  tags,
  mode,
  initialData,
}: BlogPostEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const [formData, setFormData] = useState<PostData>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    featuredImage: initialData?.featuredImage || null,
    featuredImageAlt: initialData?.featuredImageAlt || null,
    metaTitle: initialData?.metaTitle || null,
    metaDescription: initialData?.metaDescription || null,
    status: initialData?.status || "DRAFT",
    readingTime: initialData?.readingTime || null,
    categoryIds: initialData?.categoryIds || [],
    tagIds: initialData?.tagIds || [],
  });

  const [autoSlug, setAutoSlug] = useState(!initialData?.slug);

  const updateField = <K extends keyof PostData>(
    field: K,
    value: PostData[K]
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug from title
      if (field === "title" && autoSlug) {
        updated.slug = generateSlug(value as string);
      }

      // Auto-calculate reading time from content
      if (field === "content") {
        updated.readingTime = estimateReadingTime(value as string);
      }

      return updated;
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  }, []);

  const handleSave = async (status?: "DRAFT" | "PUBLISHED") => {
    setSaving(true);

    try {
      const payload = {
        ...formData,
        status: status || formData.status,
      };

      const url =
        mode === "create"
          ? "/api/admin/blog"
          : `/api/admin/blog/${initialData?.id}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save post");
      }

      const result = await response.json();
      router.push("/admin/blog");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      alert(error instanceof Error ? error.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/blog/${initialData.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_350px] gap-6">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Back button and actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to posts
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {mode === "edit" && initialData?.status === "PUBLISHED" && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`/blog/${formData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View post
                </a>
              </Button>
            )}
            {mode === "edit" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Enter post title..."
            className="text-lg font-medium"
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="slug">Slug</Label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={autoSlug}
                onCheckedChange={(checked) => setAutoSlug(checked === true)}
              />
              Auto-generate
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/blog/</span>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => {
                setAutoSlug(false);
                updateField("slug", e.target.value);
              }}
              placeholder="post-url-slug"
              className="flex-1"
            />
          </div>
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            placeholder="Brief summary of the post..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {formData.excerpt.length}/300 characters
          </p>
        </div>

        {/* Content Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Content</Label>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="edit" className="text-xs px-3">
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs px-3">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeTab === "edit" ? (
            <TiptapEditor
              content={formData.content}
              onChange={(html) => updateField("content", html)}
              placeholder="Start writing your blog post..."
              onImageUpload={handleImageUpload}
            />
          ) : (
            <div className="border border-border rounded-lg p-6 min-h-[400px] bg-background">
              {formData.content ? (
                <TiptapPreview content={formData.content} />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No content to preview
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Publish Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span
                className={`font-medium ${
                  formData.status === "PUBLISHED"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {formData.status === "PUBLISHED" ? "Published" : "Draft"}
              </span>
            </div>
            {formData.readingTime && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reading time:</span>
                <span>{formData.readingTime} min</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleSave("PUBLISHED")}
                disabled={saving || !formData.title || !formData.content}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {formData.status === "PUBLISHED" ? "Update" : "Publish"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave("DRAFT")}
                disabled={saving}
              >
                Save as Draft
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Featured Image */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Featured Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.featuredImage ? (
              <div className="relative">
                <img
                  src={formData.featuredImage}
                  alt={formData.featuredImageAlt || "Featured"}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => {
                    updateField("featuredImage", null);
                    updateField("featuredImageAlt", null);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No image selected
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  className="text-xs"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const url = await handleImageUpload(file);
                        updateField("featuredImage", url);
                      } catch (error) {
                        console.error("Upload failed:", error);
                      }
                    }
                  }}
                />
              </div>
            )}
            {formData.featuredImage && (
              <div className="space-y-2">
                <Label htmlFor="featuredImageAlt" className="text-xs">
                  Alt text (SEO)
                </Label>
                <Input
                  id="featuredImageAlt"
                  value={formData.featuredImageAlt || ""}
                  onChange={(e) =>
                    updateField("featuredImageAlt", e.target.value)
                  }
                  placeholder="Describe the image..."
                  className="text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories yet.{" "}
                <Link
                  href="/admin/blog/categories"
                  className="text-primary hover:underline"
                >
                  Create one
                </Link>
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-auto">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.categoryIds.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags yet.{" "}
                <Link
                  href="/admin/blog/tags"
                  className="text-primary hover:underline"
                >
                  Create one
                </Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      formData.tagIds.includes(tag.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle" className="text-xs">
                Meta Title
              </Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle || ""}
                onChange={(e) => updateField("metaTitle", e.target.value)}
                placeholder={formData.title || "Page title..."}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {(formData.metaTitle || formData.title).length}/60 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription" className="text-xs">
                Meta Description
              </Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription || ""}
                onChange={(e) => updateField("metaDescription", e.target.value)}
                placeholder={formData.excerpt || "Page description..."}
                rows={3}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {(formData.metaDescription || formData.excerpt).length}/160
                characters
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
