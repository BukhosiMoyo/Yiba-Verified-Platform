"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * BlogTableOfContents - Sticky sidebar table of contents for blog posts.
 * Automatically extracts headings from the article and highlights the active section.
 */
export function BlogTableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Extract headings from the article on mount
  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: Heading[] = Array.from(elements).map((el) => {
      // Ensure heading has an id for linking
      if (!el.id) {
        el.id = el.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "";
      }
      return {
        id: el.id,
        text: el.textContent || "",
        level: parseInt(el.tagName[1]),
      };
    });

    setHeadings(items);
  }, []);

  // Track active heading with intersection observer
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "0% 0% -80% 0%",
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav 
      className="p-5 bg-muted/30 rounded-xl border border-border/50" 
      aria-label="Table of contents"
    >
      <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
        On this page
      </h4>
      <ul className="space-y-1 border-l-2 border-border/60">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(heading.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                  // Update URL without triggering navigation
                  window.history.pushState(null, "", `#${heading.id}`);
                }
              }}
              className={`block text-sm py-2 pl-4 -ml-0.5 border-l-2 transition-all duration-200 ${
                heading.level === 3 ? "pl-7" : ""
              } ${
                activeId === heading.id
                  ? "text-primary font-medium border-l-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground border-l-transparent hover:border-l-border"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
