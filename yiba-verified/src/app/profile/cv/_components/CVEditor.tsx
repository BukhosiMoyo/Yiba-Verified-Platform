
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Trash } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor"; // Assuming this exists per list_dir

interface CVEditorProps {
    initialData?: {
        id?: string;
        title: string;
        content_json: any;
        pdf_url?: string | null;
    };
    isNew?: boolean;
}

export function CVEditor({ initialData, isNew = false }: CVEditorProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(
        initialData?.content_json?.html || initialData?.content_json?.summary || ""
    );

    async function handleSave() {
        if (!title) {
            toast.error("Title is required");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title,
                content_json: { html: content } // Simple structure for now
            };

            const url = isNew ? "/api/talent/cv" : `/api/talent/cv/${initialData?.id}`;
            const method = isNew ? "POST" : "PATCH";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error("Failed to save CV");
            }

            const data = await res.json();
            toast.success("CV Saved!");

            if (isNew) {
                router.push(`/profile/cv`); // Redirect to list or edit page
                router.refresh();
            } else {
                router.refresh();
            }

        } catch (error) {
            toast.error("Error saving CV");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this CV?")) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/talent/cv/${initialData?.id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("CV Deleted");
            router.push("/profile/cv");
            router.refresh();
        } catch (error) {
            toast.error("Error deleting CV");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{isNew ? "Create New CV" : "Edit CV"}</h1>
                <div className="flex gap-2">
                    {!isNew && (
                        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border p-6 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">CV Title (Internal Name)</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Software Engineer Resume 2024"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Content (Summary & Experience)</Label>
                    <div className="min-h-[400px] border rounded-md">
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            className="min-h-[400px]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
