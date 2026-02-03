
"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";

type LogoUploaderProps = {
    institutionId: string;
    currentLogo: string | null;
    className?: string;
};

export function LogoUploader({ institutionId, currentLogo, className }: LogoUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }

        // Read file for cropping
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setSelectedImageSrc(reader.result?.toString() || null);
            setCropperOpen(true);
        });
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (croppedBlob.size > 5 * 1024 * 1024) {
            alert("Image size must be less than 5MB.");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", croppedBlob, "logo.webp");

            const res = await fetch(`/api/institutions/${institutionId}/logo`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to upload logo");
            }

            // Refresh the page to show new logo
            window.location.reload();

        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to upload logo.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                    "absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 opacity-0 group-hover:opacity-100 focus:opacity-100",
                    uploading && "opacity-100 cursor-not-allowed",
                    className
                )}
                title="Change Logo"
            >
                {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Camera className="h-4 w-4" />
                )}
            </button>

            {selectedImageSrc && (
                <ImageCropperModal
                    open={cropperOpen}
                    onOpenChange={setCropperOpen}
                    imageSrc={selectedImageSrc}
                    onCropComplete={handleCropComplete}
                    aspect={1}
                />
            )}
        </>
    );
}
