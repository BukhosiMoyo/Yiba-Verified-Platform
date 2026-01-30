import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    featuredImage?: string | null;
    featuredImageAlt?: string | null;
    publishedAt: Date | null;
    readingTime?: number | null;
    categories: { category: { name: string; slug: string } }[];
  };
  featured?: boolean;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group block bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-float hover:border-border transition-all duration-300 hover:-translate-y-1 ${
        featured ? "md:col-span-2 md:grid md:grid-cols-2" : ""
      }`}
    >
      {/* Image */}
      {post.featuredImage ? (
        <div
          className={`relative ${
            featured ? "h-72 md:h-full min-h-[320px]" : "h-52"
          } overflow-hidden bg-muted`}
        >
          <Image
            src={post.featuredImage}
            alt={post.featuredImageAlt || post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div
          className={`relative ${
            featured ? "h-72 md:h-full min-h-[320px]" : "h-52"
          } overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center`}
        >
          <div className="text-7xl text-primary/15 font-bold select-none">
            {post.title.charAt(0)}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`p-6 ${featured ? "md:p-8 md:flex md:flex-col md:justify-center" : ""}`}>
        {/* Categories */}
        {post.categories.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {post.categories.slice(0, 2).map(({ category }) => (
              <Badge 
                key={category.slug} 
                variant="secondary" 
                className="text-xs px-3 py-1 font-medium"
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h3
          className={`font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug ${
            featured ? "text-2xl md:text-3xl" : "text-lg"
          }`}
        >
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className={`text-muted-foreground leading-relaxed mb-5 ${
          featured ? "text-base line-clamp-3" : "text-sm line-clamp-2"
        }`}>
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-5 text-xs text-muted-foreground pt-4 border-t border-border/50">
          {post.publishedAt && (
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary/60" />
              {formatDate(post.publishedAt)}
            </span>
          )}
          {post.readingTime && (
            <span className="inline-flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary/60" />
              {post.readingTime} min read
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
