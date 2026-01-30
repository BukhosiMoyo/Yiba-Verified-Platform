import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Safe wrapper around Next.js Link that ensures href is never undefined
 */
export function SafeLink({
  href,
  ...props
}: ComponentProps<typeof Link>) {
  // Ensure href is always a valid string or object
  const safeHref = href || "#";
  
  return <Link href={safeHref} {...props} />;
}
