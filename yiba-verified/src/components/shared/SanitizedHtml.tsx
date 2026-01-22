"use client";

import DOMPurify from "isomorphic-dompurify";

export interface SanitizedHtmlProps {
  html: string;
  /** For plain-text legacy messages: convert newlines to <br> before sanitizing. */
  className?: string;
  /** Tag to render as (div, span, etc.). Default div. */
  as?: "div" | "span" | "p";
}

/**
 * Renders HTML safely using DOMPurify.
 * - Use for announcement message and any user-provided or stored HTML.
 * - Legacy plain-text: if html has no tags, newlines are turned into <br>.
 */
export function SanitizedHtml({
  html,
  className,
  as: Tag = "div",
}: SanitizedHtmlProps) {
  let toSanitize = html || "";
  if (toSanitize && !/<\w/.test(toSanitize)) {
    toSanitize = toSanitize.replace(/\n/g, "<br>");
  }
  const cleaned = DOMPurify.sanitize(toSanitize, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "h2", "h3", "blockquote", "img", "hr",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "target", "rel"],
  });

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: cleaned }}
    />
  );
}
