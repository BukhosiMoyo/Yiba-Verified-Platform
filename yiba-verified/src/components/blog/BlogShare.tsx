"use client";

import { useState } from "react";
import { Twitter, Linkedin, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogShareProps {
  title: string;
  url: string;
}

/**
 * BlogShare - Social sharing buttons for blog posts.
 */
export function BlogShare({ title, url }: BlogShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">
        Share this article:
      </span>
      <div className="flex items-center gap-2">
        {shareLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Button
              key={link.name}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              asChild
            >
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${link.name}`}
              >
                <Icon className="h-4 w-4" />
              </a>
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-xl transition-colors ${
            copied 
              ? "bg-green-500/10 border-green-500/50 text-green-600" 
              : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
          }`}
          onClick={handleCopyLink}
          aria-label="Copy link"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
