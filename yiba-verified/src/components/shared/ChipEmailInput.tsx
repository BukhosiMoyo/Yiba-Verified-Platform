"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChipEmailInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
    error?: string;
}

export function ChipEmailInput({
    value = [],
    onChange,
    placeholder = "Type email and press Enter...",
    className,
    error,
}: ChipEmailInputProps) {
    const [inputValue, setInputValue] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (["Enter", ",", "Tab"].includes(e.key)) {
            e.preventDefault();
            addEmail();
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            // Remove last tag if input is empty
            onChange(value.slice(0, -1));
        }
    };

    const addEmail = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        // Basic validation
        // Allow simple format, we validate strictly on submit or we can strict here.
        // User wants "looks nicer", "just click x to remove".
        // Let's do basic check to avoid adding garbage
        if (trimmed.length < 3 || !trimmed.includes("@")) {
            // Maybe flash error? For now just don't add
            return;
        }

        if (!value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setInputValue("");
    };

    const removeEmail = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const paste = e.clipboardData.getData("text");
        const emails = paste
            .split(/[\n,;\s]+/)
            .map((em) => em.trim())
            .filter((em) => em.length > 0 && em.includes("@"));

        if (emails.length > 0) {
            // Add unique ones
            const uniqueNew = emails.filter((em) => !value.includes(em));
            onChange([...value, ...uniqueNew]);
        }
    };

    return (
        <div className={cn("space-y-1", className)}>
            <div
                className={cn(
                    "flex flex-wrap gap-2 p-2 min-h-[42px] rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                    error && "border-destructive focus-within:ring-destructive"
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((email, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1 font-normal">
                        {email}
                        <button
                            type="button"
                            className="rounded-full hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeEmail(i);
                            }}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[200px] text-sm"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addEmail}
                    onPaste={handlePaste}
                    placeholder={value.length === 0 ? placeholder : ""}
                />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>
    );
}
