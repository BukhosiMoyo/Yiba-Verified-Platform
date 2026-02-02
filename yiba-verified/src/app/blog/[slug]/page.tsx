import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { BlogContent } from "@/components/blog/BlogContent";
import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import { BlogAuthor } from "@/components/blog/BlogAuthor";
import { BlogShare } from "@/components/blog/BlogShare";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Calendar, Clock, RefreshCw } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

async function getPost(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { first_name: true, last_name: true, image: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.featuredImage
        ? [
          {
            url: post.featuredImage,
            alt: post.featuredImageAlt || post.title,
          },
        ]
        : undefined,
      url: `${baseUrl}/blog/${post.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export async function generateStaticParams() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });

    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.warn("Could not fetch blog posts for static generation (likely DB connection issue). Skipping pre-generation.", error);
    return [];
  }
}

export const revalidate = 3600; // Revalidate every hour

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";
  const postUrl = `${baseUrl}/blog/${post.slug}`;

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: `${post.author.first_name} ${post.author.last_name}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Yiba Verified",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/Yiba%20Verified%20Icon.webp`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };

  return (
    <>
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex min-h-screen flex-col">
        <MarketingNav />
        <main className="flex-1">
          <article className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Back link */}
              <div className="mb-10">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Blog
                </Link>
              </div>

              {/* Header */}
              <header className="max-w-3xl mx-auto text-center mb-16">
                {/* Categories */}
                {post.categories.length > 0 && (
                  <div className="flex gap-2 justify-center mb-8">
                    {post.categories.map(({ category }) => (
                      <Link
                        key={category.slug}
                        href={`/blog/category/${category.slug}`}
                      >
                        <Badge
                          variant="secondary"
                          className="px-4 py-1.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-8">
                  {post.title}
                </h1>

                {/* Excerpt */}
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {post.publishedAt && (
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary/70" />
                      <span>Published {formatDate(post.publishedAt)}</span>
                    </span>
                  )}
                  {post.updatedAt && post.publishedAt && post.updatedAt.getTime() - post.publishedAt.getTime() > 86400000 && (
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-primary/70" />
                      <span>Updated {formatDate(post.updatedAt)}</span>
                    </span>
                  )}
                  {post.readingTime && (
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary/70" />
                      <span>{post.readingTime} min read</span>
                    </span>
                  )}
                </div>
              </header>

              {/* Featured Image */}
              {post.featuredImage && (
                <div className="relative aspect-[21/9] max-w-5xl mx-auto mb-12 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={post.featuredImage}
                    alt={post.featuredImageAlt || post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Content with TOC */}
              <div className="grid lg:grid-cols-[1fr_280px] gap-16 max-w-5xl mx-auto">
                {/* Main Content */}
                <div className="min-w-0">
                  <BlogContent content={post.content} />

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-border">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          Tags:
                        </span>
                        {post.tags.map(({ tag }) => (
                          <Link
                            key={tag.slug}
                            href={`/blog/tag/${tag.slug}`}
                            className="px-4 py-1.5 rounded-full bg-muted text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Share */}
                  <div className="mt-10 pt-10 border-t border-border">
                    <BlogShare title={post.title} url={postUrl} />
                  </div>

                  {/* Author */}
                  <div className="mt-10 pt-10 border-t border-border">
                    <BlogAuthor author={post.author} />
                  </div>
                </div>

                {/* Sidebar with TOC */}
                <aside className="hidden lg:block">
                  <div className="sticky top-24">
                    <BlogTableOfContents />
                  </div>
                </aside>
              </div>
            </div>
          </article>
        </main>
        <MarketingFooter />
      </div>
    </>
  );
}
